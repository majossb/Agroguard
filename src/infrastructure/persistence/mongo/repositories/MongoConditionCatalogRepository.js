import { ConditionCatalogRepository } from '../../../../application/ports/ConditionCatalogRepository.js';
import { ConditionModel } from '../schemas/ConditionSchema.js';
import { ConditionMongoMapper } from '../mappers/ConditionMongoMapper.js';
import { ClassKeyParser } from '../../../../domain/services/ClassKeyParser.js';

/**
 * Adaptador de repositorio del catálogo fitopatológico con MongoDB / Mongoose.
 * @implements {ConditionCatalogRepository}
 */
export class MongoConditionCatalogRepository extends ConditionCatalogRepository {
  async save(condition) {
    const mongoData = ConditionMongoMapper.toMongo(condition);
    await ConditionModel.findByIdAndUpdate(condition.classKey, mongoData, {
      upsert: true,
      new: true,
    });
    return condition;
  }

  async findByClassKey(classKey) {
    const doc = await ConditionModel.findById(classKey).lean();
    return ConditionMongoMapper.toDomain(doc);
  }

  async findAll(filters = {}) {
    const query = {};

    if (filters.cropKey) {
      query.cropKey = String(filters.cropKey);
    }
    if (typeof filters.isHealthy === 'boolean') {
      query.isHealthy = filters.isHealthy;
    }

    const docs = await ConditionModel.find(query).sort({ cropKey: 1, isHealthy: -1 }).lean();
    return docs.map((doc) => ConditionMongoMapper.toDomain(doc));
  }

  async findCrops() {
    const aggregation = await ConditionModel.aggregate([
      {
        $group: {
          _id: '$cropKey',
          conditionsCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return aggregation.map((item) => ({
      cropKey: item._id,
      cropName: ClassKeyParser.getCropName(item._id),
      conditionsCount: item.conditionsCount,
    }));
  }
}
