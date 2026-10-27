import { InferenceEngine } from '../../application/ports/InferenceEngine.js';
import {
  InferenceUnavailableError,
  InvalidInferenceResultError,
} from '../../domain/errors/DomainError.js';
import {
  WeightedVotingEnsemble,
  ENSEMBLE_WEIGHTS,
} from '../../domain/services/WeightedVotingEnsemble.js';

/**
 * Adaptador de infraestructura que conecta con el microservicio FastAPI de Ensemble
 * para ejecutar la inferencia real sobre los 4 modelos Keras vía HTTP.
 * @implements {InferenceEngine}
 */
export class HttpEnsembleInferenceEngine extends InferenceEngine {
  /**
   * @param {object} options
   * @param {string} options.serviceUrl - URL base del servicio ensemble (e.g. http://localhost:8002)
   * @param {readonly string[]} options.classNames - Lista de 38 clases
   * @param {number} [options.timeoutMs=15000] - Timeout para la petición HTTP
   * @param {object} [options.logger] - Logger de Pino
   */
  constructor({ serviceUrl, classNames, timeoutMs = 15000, logger = null }) {
    super();
    if (!Array.isArray(classNames) || classNames.length === 0) {
      throw new Error('HttpEnsembleInferenceEngine requiere una lista válida de classNames.');
    }
    this.serviceUrl = serviceUrl.replace(/\/+$/, '');
    this.classNames = classNames;
    this.timeoutMs = timeoutMs;
    this.logger = logger;
  }

  /**
   * Ejecuta la predicción real enviando la imagen al microservicio de ensemble.
   * @param {{ buffer: Buffer, mimeType: string }} image
   * @returns {Promise<import('../../application/ports/InferenceEngine.js').InferenceResult & { ensembleBreakdown: any }>}
   */
  async predict(image) {
    if (!image || !Buffer.isBuffer(image.buffer)) {
      throw new InvalidInferenceResultError('Se requiere un buffer de imagen válido.');
    }

    const base64Image = image.buffer.toString('base64');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.serviceUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64Image }),
        signal: controller.signal,
      });

      if (response.status === 503) {
        throw new InferenceUnavailableError(
          'El servicio de inferencia ensemble no está disponible.'
        );
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new InferenceUnavailableError(
          `Error del servicio ensemble (HTTP ${response.status}): ${errorBody.detail || 'Error desconocido'}`
        );
      }

      const result = await response.json();

      if (this.logger) {
        this.logger.info(
          {
            predictedClass: result.predictedClass,
            score: result.ensembleScore,
            timeMs: result.inferenceTimeMs,
          },
          'Inferencia ensemble completada'
        );
      }

      // Construir probabilities[] a partir de modelOutputs usando WeightedVotingEnsemble
      const ensembleResult = WeightedVotingEnsemble.combine({
        modelOutputs: result.modelOutputs,
        classNames: this.classNames,
        weights: ENSEMBLE_WEIGHTS,
      });

      return {
        modelName: 'AgroGuard_Weighted_Voting_Ensemble_v1',
        modelVersion: '1.0.0',
        provider: 'ensemble',
        probabilities: ensembleResult.ensembleProbabilities,
        inferenceTimeMs: result.inferenceTimeMs || 0,
        ensembleBreakdown: {
          weights: ENSEMBLE_WEIGHTS,
          models: ensembleResult.modelsBreakdown,
          consensus: ensembleResult.consensus,
          latencyMs: result.inferenceTimeMs || 0,
          winningClassKey: ensembleResult.winningClassKey,
          globalConfidence: ensembleResult.globalConfidence,
        },
        explanation: null,
      };
    } catch (error) {
      if (
        error instanceof InferenceUnavailableError ||
        error instanceof InvalidInferenceResultError
      ) {
        throw error;
      }

      if (error.name === 'AbortError') {
        throw new InferenceUnavailableError(
          `Timeout al contactar el servicio ensemble (${this.timeoutMs}ms).`
        );
      }

      throw new InferenceUnavailableError(
        `No se pudo contactar el servicio ensemble: ${error.message}`
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Metadatos de la arquitectura del ensamble.
   */
  async info() {
    try {
      const response = await fetch(`${this.serviceUrl}/health`);
      const data = await response.json();

      return {
        name: 'AgroGuard Deep Ensemble (Weighted Voting)',
        version: '1.0.0',
        inputSize: 224,
        classCount: data.class_count || this.classNames.length,
        dataset: 'New Plant Diseases Dataset (PlantVillage, 38 clases)',
        metrics: {
          weights: ENSEMBLE_WEIGHTS,
          architectures: [
            'EfficientNet-B0 (35%)',
            'ResNet-50 (30%)',
            'MobileNet-V2 (20%)',
            'CNN Base (15%)',
          ],
        },
        evaluationNote:
          'Ensamble de 4 arquitecturas profundas reales con preprocesamiento específico por modelo.',
      };
    } catch {
      return {
        name: 'AgroGuard Deep Ensemble (Weighted Voting)',
        version: '1.0.0',
        inputSize: 224,
        classCount: this.classNames.length,
        dataset: 'New Plant Diseases Dataset (PlantVillage, 38 clases)',
        metrics: { weights: ENSEMBLE_WEIGHTS },
        evaluationNote: 'Servicio ensemble no disponible para consultar métricas.',
      };
    }
  }

  /**
   * Verifica la disponibilidad del servicio ensemble.
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
      return data.models_loaded === true;
    } catch {
      return false;
    }
  }
}
