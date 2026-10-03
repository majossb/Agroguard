import { ValidationError } from '../errors/DomainError.js';
import { HealthStatus } from '../value-objects/HealthStatus.js';
import { ImageInfo } from '../value-objects/ImageInfo.js';

/**
 * Entidad de Dominio Diagnosis.
 */
export class Diagnosis {
  /**
   * @param {object} params
   * @param {string} params.id
   * @param {string|null} params.ownerId - ID del usuario dueño o null si es anónimo
   * @param {ImageInfo|object} params.image - Metadatos de la imagen
   * @param {{ healthStatus: HealthStatus|string, confidence: number, healthyProbability: number }} params.verdict
   * @param {{ classKey: string, cropKey: string, conditionKey: string, cropName?: string, conditionName?: string }} params.prediction
   * @param {Array<{ classKey: string, probability: number }>} params.topPredictions
   * @param {string[]} [params.warnings=[]]
   * @param {string|null} [params.message=null]
   * @param {{ name: string, version: string, provider: 'mock'|'http' }} params.model
   * @param {number} params.processingTimeMs
   * @param {{ plotName?: string, cropHint?: string, notes?: string }} [params.context={}]
   * @param {Date} [params.createdAt]
   */
  constructor({
    id,
    ownerId = null,
    image,
    verdict,
    prediction,
    topPredictions,
    warnings = [],
    message = null,
    model,
    processingTimeMs,
    context = {},
    createdAt,
  }) {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('El ID del diagnóstico es obligatorio', 'DIAGNOSIS_ID_REQUIRED');
    }
    if (!verdict || typeof verdict !== 'object') {
      throw new ValidationError('El veredicto del diagnóstico es obligatorio', 'DIAGNOSIS_VERDICT_REQUIRED');
    }
    if (!prediction || typeof prediction.classKey !== 'string') {
      throw new ValidationError('La predicción principal es obligatoria', 'DIAGNOSIS_PREDICTION_REQUIRED');
    }
    if (!Array.isArray(topPredictions) || topPredictions.length === 0) {
      throw new ValidationError('Las mejores predicciones son obligatorias', 'DIAGNOSIS_TOP_PREDICTIONS_REQUIRED');
    }

    this.id = id;
    this.ownerId = ownerId || null;
    this.image = image instanceof ImageInfo ? image : new ImageInfo(image);
    this.verdict = {
      healthStatus:
        verdict.healthStatus instanceof HealthStatus
          ? verdict.healthStatus
          : new HealthStatus(verdict.healthStatus),
      confidence: verdict.confidence,
      healthyProbability: verdict.healthyProbability,
    };
    this.prediction = {
      classKey: prediction.classKey,
      cropKey: prediction.cropKey,
      conditionKey: prediction.conditionKey,
      cropName: prediction.cropName || '',
      conditionName: prediction.conditionName || '',
    };
    this.topPredictions = Object.freeze([...topPredictions]);
    this.warnings = Object.freeze([...warnings]);
    this.message = message || null;
    this.model = Object.freeze({ ...model });
    this.processingTimeMs = processingTimeMs;
    this.context = Object.freeze({ ...context });
    this.createdAt = createdAt || new Date();

    Object.freeze(this);
  }

  isAnonymous() {
    return this.ownerId === null;
  }
}
