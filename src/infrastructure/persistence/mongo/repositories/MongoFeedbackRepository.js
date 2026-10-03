import { FeedbackRepository } from '../../../../application/ports/FeedbackRepository.js';
import { FeedbackModel } from '../schemas/FeedbackSchema.js';
import { FeedbackMongoMapper } from '../mappers/FeedbackMongoMapper.js';

/**
 * Adaptador de repositorio de feedback con MongoDB / Mongoose.
 * @implements {FeedbackRepository}
 */
export class MongoFeedbackRepository extends FeedbackRepository {
  async save(feedback) {
    const mongoData = FeedbackMongoMapper.toMongo(feedback);
    await FeedbackModel.findByIdAndUpdate(feedback.id, mongoData, {
      upsert: true,
      new: true,
    });
    return feedback;
  }

  async findByDiagnosisId(diagnosisId) {
    const doc = await FeedbackModel.findOne({ diagnosisId }).lean();
    return FeedbackMongoMapper.toDomain(doc);
  }

  async deleteByDiagnosisId(diagnosisId) {
    const result = await FeedbackModel.deleteOne({ diagnosisId });
    return result.deletedCount > 0;
  }

  async deleteByOwnerId(ownerId) {
    const result = await FeedbackModel.deleteMany({ ownerId });
    return result.deletedCount || 0;
  }
}
