import { ConditionCatalogRepository } from '../../src/application/ports/ConditionCatalogRepository.js';
import { ClassKeyParser } from '../../src/domain/services/ClassKeyParser.js';

export class FakeConditionCatalogRepository extends ConditionCatalogRepository {
  constructor() {
    super();
    /** @type {Map<string, import('../../src/domain/entities/Condition.js').Condition>} */
    this.store = new Map();
  }

  async save(condition) {
    this.store.set(condition.classKey, condition);
    return condition;
  }

  async findByClassKey(classKey) {
    return this.store.get(classKey) || null;
  }

  async findAll(filters = {}) {
    let items = [...this.store.values()];
    if (filters.cropKey) {
      items = items.filter((c) => c.cropKey === filters.cropKey);
    }
    if (typeof filters.isHealthy === 'boolean') {
      items = items.filter((c) => c.isHealthy === filters.isHealthy);
    }
    return items;
  }

  async findCrops() {
    const cropMap = new Map();
    for (const condition of this.store.values()) {
      const cropName = ClassKeyParser.getCropName(condition.cropKey);
      if (!cropMap.has(condition.cropKey)) {
        cropMap.set(condition.cropKey, { cropKey: condition.cropKey, cropName, conditionsCount: 0 });
      }
      cropMap.get(condition.cropKey).conditionsCount++;
    }
    return [...cropMap.values()];
  }

  get size() {
    return this.store.size;
  }
}
