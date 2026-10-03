import { InferenceEngine } from '../../application/ports/InferenceEngine.js';
import {
  InferenceUnavailableError,
  InvalidInferenceResultError,
  InvalidImageError,
} from '../../domain/errors/DomainError.js';

/**
 * Adaptador de inferencia HTTP para conectar con microservicios externos (FastAPI, TorchServe, TF Serving, Triton).
 * @implements {InferenceEngine}
 */
export class HttpInferenceEngine extends InferenceEngine {
  /**
   * @param {object} options
   * @param {string} options.url - URL base del servicio de inferencia
   * @param {number} [options.timeoutMs=15000] - Tiempo máximo de espera por petición
   * @param {number} [options.retries=2] - Número de reintentos ante fallos transitorios
   * @param {string} [options.apiKey] - Clave de API para autenticación opcional
   * @param {object} [options.logger] - Logger
   * @param {typeof fetch} [options.fetchFn=globalThis.fetch] - Función fetch inyectable para pruebas
   */
  constructor({
    url,
    timeoutMs = 15000,
    retries = 2,
    apiKey = '',
    logger = null,
    fetchFn = globalThis.fetch,
  }) {
    super();
    if (!url || typeof url !== 'string') {
      throw new Error('HttpInferenceEngine requiere una URL válida.');
    }
    this.baseUrl = url.replace(/\/+$/, '');
    this.timeoutMs = timeoutMs;
    this.retries = retries;
    this.apiKey = apiKey;
    this.logger = logger;
    this.fetch = fetchFn;
  }

  /**
   * Realiza una petición HTTP con timeout y reintentos automáticos con backoff.
   * @private
   */
  async #fetchWithRetry(endpoint, options = {}) {
    let lastError = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const headers = { ...options.headers };
        if (this.apiKey) {
          headers['X-API-Key'] = this.apiKey;
        }

        const response = await this.fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Si es 5xx o 429, consideramos error transitorio elegible para reintento
        if ((response.status >= 500 || response.status === 429) && attempt < this.retries) {
          const delay = Math.min(100 * Math.pow(2, attempt), 2000);
          await new Promise((res) => setTimeout(res, delay));
          continue;
        }

        return response;
      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err;

        if (attempt < this.retries) {
          const delay = Math.min(100 * Math.pow(2, attempt), 2000);
          await new Promise((res) => setTimeout(res, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Envía la imagen al microservicio de inferencia.
   * @param {{ buffer: Buffer, mimeType: 'image/jpeg' }} image
   * @returns {Promise<import('../../application/ports/InferenceEngine.js').InferenceResult>}
   */
  async predict(image) {
    const formData = new FormData();
    const blob = new Blob([image.buffer], { type: image.mimeType });
    formData.append('image', blob, 'leaf.jpg');

    let response;
    try {
      response = await this.#fetchWithRetry('/predict', {
        method: 'POST',
        body: formData,
      });
    } catch (err) {
      if (this.logger) {
        this.logger.error({ error: err.message }, 'Fallo de conexión con el servicio de inferencia');
      }
      throw new InferenceUnavailableError(
        'El servicio de inferencia no está disponible temporalmente.',
        'INFERENCE_UNAVAILABLE'
      );
    }

    if (response.status === 400 || response.status === 415 || response.status === 422) {
      const errorBody = await response.json().catch(() => ({}));
      throw new InvalidImageError(
        errorBody.detail || errorBody.message || 'La imagen no pudo ser procesada por el modelo.',
        'IMAGE_INVALID_TYPE'
      );
    }

    if (!response.ok) {
      throw new InferenceUnavailableError(
        `El servicio de inferencia respondió con código HTTP ${response.status}.`,
        'INFERENCE_UNAVAILABLE'
      );
    }

    let result;
    try {
      result = await response.json();
    } catch {
      throw new InvalidInferenceResultError(
        'La respuesta del servicio de inferencia no es un JSON válido.'
      );
    }

    if (!result || !Array.isArray(result.probabilities)) {
      throw new InvalidInferenceResultError(
        'La respuesta del servicio de inferencia no contiene la propiedad "probabilities".'
      );
    }

    return {
      modelName: result.modelName || 'RemoteModel',
      modelVersion: result.modelVersion || '1.0.0',
      provider: result.provider || 'http',
      probabilities: result.probabilities,
      inferenceTimeMs: result.inferenceTimeMs || 0,
      explanation: result.explanation || null,
    };
  }

  /**
   * Obtiene la información técnica del modelo remoto.
   * @returns {Promise<import('../../application/ports/InferenceEngine.js').ModelInfo>}
   */
  async info() {
    try {
      const response = await this.#fetchWithRetry('/info', { method: 'GET' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return {
        name: data.name || 'RemoteModel',
        version: data.version || '1.0.0',
        inputSize: data.inputSize || 224,
        classCount: data.classCount || 38,
        dataset: data.dataset || 'PlantVillage Dataset',
        metrics: data.metrics || null,
        evaluationNote:
          data.evaluationNote ||
          'Métricas pendientes de verificación con una evaluación reproducible',
      };
    } catch {
      return {
        name: 'RemoteModel',
        version: '1.0.0',
        inputSize: 224,
        classCount: 38,
        dataset: 'PlantVillage Dataset',
        metrics: null,
        evaluationNote: 'Métricas pendientes de verificación con una evaluación reproducible',
      };
    }
  }

  /**
   * Verifica la disponibilidad del servicio remoto.
   * @returns {Promise<boolean>}
   */
  async isReady() {
    try {
      const response = await this.#fetchWithRetry('/health', { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }
}
