import { Condition } from '../../../../domain/entities/Condition.js';

export class ConditionMongoMapper {
  static toDomain(doc) {
    if (!doc) return null;

    return new Condition({
      classKey: doc._id.toString(),
      cropKey: doc.cropKey,
      conditionKey: doc.conditionKey,
      isHealthy: doc.isHealthy,
      names: doc.names,
      description: doc.description || '',
      symptoms: doc.symptoms || [],
      management: doc.management || { cultural: [], biological: [], chemical: [] },
      reviewStatus: doc.reviewStatus,
      reviewedBy: doc.reviewedBy || null,
      reviewedAt: doc.reviewedAt || null,
      sources: doc.sources || [],
    });
  }

  static toMongo(entity) {
    return {
      _id: entity.classKey,
      cropKey: entity.cropKey,
      conditionKey: entity.conditionKey,
      isHealthy: entity.isHealthy,
      names: entity.names,
      description: entity.description,
      symptoms: entity.symptoms,
      management: entity.management,
      reviewStatus: entity.reviewStatus,
      reviewedBy: entity.reviewedBy,
      reviewedAt: entity.reviewedAt,
      sources: entity.sources,
    };
  }
}
