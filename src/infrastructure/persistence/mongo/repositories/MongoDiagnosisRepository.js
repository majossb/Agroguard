import { DiagnosisRepository } from '../../../../application/ports/DiagnosisRepository.js';
import { DiagnosisModel } from '../schemas/DiagnosisSchema.js';
import { DiagnosisMongoMapper } from '../mappers/DiagnosisMongoMapper.js';

/**
 * Adaptador de repositorio de diagnósticos con MongoDB / Mongoose.
 * @implements {DiagnosisRepository}
 */
export class MongoDiagnosisRepository extends DiagnosisRepository {
  async save(diagnosis) {
    const mongoData = DiagnosisMongoMapper.toMongo(diagnosis);
    await DiagnosisModel.findByIdAndUpdate(diagnosis.id, mongoData, {
      upsert: true,
      new: true,
      runValidators: true,
    });
    return diagnosis;
  }

  async findById(id) {
    const doc = await DiagnosisModel.findById(id).lean();
    return DiagnosisMongoMapper.toDomain(doc);
  }

  async findByOwner(ownerId, filters = {}, pagination = { page: 1, pageSize: 20 }) {
    const query = { ownerId };

    // Construcción segura campo a campo (previene inyección NoSQL)
    if (filters.healthStatus) {
      query['verdict.healthStatus'] = String(filters.healthStatus);
    }
    if (filters.cropKey) {
      query['prediction.cropKey'] = String(filters.cropKey);
    }
    if (filters.from || filters.to) {
      query.createdAt = {};
      if (filters.from) {
        query.createdAt.$gte = new Date(filters.from);
      }
      if (filters.to) {
        query.createdAt.$lte = new Date(filters.to);
      }
    }

    const pageSize = Math.min(Math.max(1, pagination.pageSize || 20), 50);
    const page = Math.max(1, pagination.page || 1);
    const skip = (page - 1) * pageSize;

    const [docs, totalItems] = await Promise.all([
      DiagnosisModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      DiagnosisModel.countDocuments(query),
    ]);

    const items = docs.map((doc) => DiagnosisMongoMapper.toDomain(doc));
    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    return {
      items,
      page,
      pageSize,
      totalItems,
      totalPages,
    };
  }

  async deleteById(id) {
    const result = await DiagnosisModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  async deleteByOwnerId(ownerId) {
    const result = await DiagnosisModel.deleteMany({ ownerId });
    return result.deletedCount || 0;
  }
}
