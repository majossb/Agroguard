import { Feedback } from '../../../../domain/entities/Feedback.js';

export class FeedbackMongoMapper {
  static toDomain(doc) {
    if (!doc) return null;

    return new Feedback({
      id: doc._id.toString(),
      diagnosisId: doc.diagnosisId,
      ownerId: doc.ownerId,
      wasCorrect: doc.wasCorrect,
      correctClassKey: doc.correctClassKey,
      comment: doc.comment,
      createdAt: doc.createdAt,
    });
  }

  static toMongo(entity) {
    return {
      _id: entity.id,
      diagnosisId: entity.diagnosisId,
      ownerId: entity.ownerId,
      wasCorrect: entity.wasCorrect,
      correctClassKey: entity.correctClassKey,
      comment: entity.comment,
      createdAt: entity.createdAt,
    };
  }
}
