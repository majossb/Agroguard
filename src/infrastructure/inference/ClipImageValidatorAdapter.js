import { ImageValidator } from '../../application/ports/ImageValidator.js';
import { InferenceUnavailableError } from '../../domain/errors/DomainError.js';

/**
 * Adaptador de infraestructura que conecta con el microservicio FastAPI de CLIP
 * para validar imágenes antes de la inferencia del ensemble.
 * @implements {ImageValidator}
 */
export class ClipImageValidatorAdapter extends ImageValidator {
  /**
   * @param {object} options
   * @param {string} options.serviceUrl - URL base del servicio CLIP (e.g. http://localhost:8001)
   * @param {number} [options.timeoutMs=15000] - Timeout para la petición HTTP
   * @param {object} [options.logger] - Logger de Pino
   */
  constructor({ serviceUrl, timeoutMs = 15000, logger = null }) {
    super();
    this.serviceUrl = serviceUrl.replace(/\/+$/, '');
    this.timeoutMs = timeoutMs;
    this.logger = logger;
  }

  /**
   * Valida una imagen enviándola al microservicio CLIP.
   * @param {Buffer} imageBuffer
   * @returns {Promise<import('../../application/ports/ImageValidator.js').ValidationResult>}
   */
  async validate(imageBuffer) {
    const base64Image = imageBuffer.toString('base64');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.serviceUrl}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64Image }),
        signal: controller.signal,
      });

      if (response.status === 503) {
        throw new InferenceUnavailableError(
          'El servicio de validación CLIP no está disponible. No se puede procesar la imagen.'
        );
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new InferenceUnavailableError(
          `Error del servicio CLIP (HTTP ${response.status}): ${errorBody.detail || 'Error desconocido'}`
        );
      }

      const result = await response.json();

      if (this.logger) {
        this.logger.info(
          { state: result.state, reason: result.reason },
          'Validación CLIP completada'
        );
      }

      return {
        state: result.state,
        reason: result.reason,
        topLabels: result.topLabels || [],
      };
    } catch (error) {
      if (error instanceof InferenceUnavailableError) {
        throw error;
      }

      if (error.name === 'AbortError') {
        throw new InferenceUnavailableError(
          `Timeout al contactar el servicio CLIP (${this.timeoutMs}ms).`
        );
      }

      // Fail-safe: si CLIP no está disponible, NO aceptar por defecto
      throw new InferenceUnavailableError(
        `No se pudo contactar el servicio CLIP: ${error.message}`
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Verifica la disponibilidad del servicio CLIP.
   * @returns {Promise<boolean>}
   */
  async isReady() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.serviceUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) return false;
      const data = await response.json();
      return data.model_loaded === true;
    } catch {
      return false;
    }
  }
}
