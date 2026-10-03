import { Diagnosis } from '../../../../domain/entities/Diagnosis.js';
import { HealthStatus } from '../../../../domain/value-objects/HealthStatus.js';
import { ImageInfo } from '../../../../domain/value-objects/ImageInfo.js';

export class DiagnosisMongoMapper {
  /**
   * Transforma documento Mongoose a entidad Diagnosis
   * @param {any} doc
   * @returns {Diagnosis|null}
   */
  static toDomain(doc) {
    if (!doc) return null;

    return new Diagnosis({
      id: doc._id.toString(),
      ownerId: doc.ownerId || null,
      image: new ImageInfo({
        storageKey: doc.image.storageKey,
        mimeType: doc.image.mimeType,
        sizeBytes: doc.image.sizeBytes,
        width: doc.image.width,
        height: doc.image.height,
        sha256: doc.image.sha256,
      }),
      verdict: {
        healthStatus: new HealthStatus(doc.verdict.healthStatus),
        confidence: doc.verdict.confidence,
        healthyProbability: doc.verdict.healthyProbability,
      },
      prediction: {
        classKey: doc.prediction.classKey,
        cropKey: doc.prediction.cropKey,
        conditionKey: doc.prediction.conditionKey,
        cropName: doc.prediction.cropName || '',
        conditionName: doc.prediction.conditionName || '',
      },
      topPredictions: doc.topPredictions,
      warnings: doc.warnings || [],
      message: doc.message || null,
      model: doc.model,
      processingTimeMs: doc.processingTimeMs,
      context: doc.context || {},
      createdAt: doc.createdAt,
    });
  }

  /**
   * Transforma entidad Diagnosis a objeto plano para Mongoose
   * @param {Diagnosis} entity
   * @returns {object}
   */
  static toMongo(entity) {
    return {
      _id: entity.id,
      ownerId: entity.ownerId,
      image: {
        storageKey: entity.image.storageKey,
        mimeType: entity.image.mimeType,
        sizeBytes: entity.image.sizeBytes,
        width: entity.image.width,
        height: entity.image.height,
        sha256: entity.image.sha256,
      },
      verdict: {
        healthStatus: entity.verdict.healthStatus.value,
        confidence: entity.verdict.confidence,
        healthyProbability: entity.verdict.healthyProbability,
      },
      prediction: {
        classKey: entity.prediction.classKey,
        cropKey: entity.prediction.cropKey,
        conditionKey: entity.prediction.conditionKey,
        cropName: entity.prediction.cropName,
        conditionName: entity.prediction.conditionName,
      },
      topPredictions: entity.topPredictions,
      warnings: entity.warnings,
      message: entity.message,
      model: entity.model,
      processingTimeMs: entity.processingTimeMs,
      context: entity.context,
      createdAt: entity.createdAt,
    };
  }
}
