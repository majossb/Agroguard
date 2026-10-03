/**
 * Caso de uso para listar las condiciones del catálogo fitopatológico.
 */
export class ListConditions {
  /**
   * @param {object} dependencies
   * @param {import('../../ports/ConditionCatalogRepository.js').ConditionCatalogRepository} dependencies.conditionCatalogRepository
   */
  constructor({ conditionCatalogRepository }) {
    this.conditionCatalogRepository = conditionCatalogRepository;
  }

  /**
   * @param {import('../../ports/ConditionCatalogRepository.js').ConditionFilters} [filters={}]
   * @returns {Promise<Array<object>>}
   */
  async execute(filters = {}) {
    const conditions = await this.conditionCatalogRepository.findAll(filters);

    return conditions.map((c) => ({
      classKey: c.classKey,
      cropKey: c.cropKey,
      conditionKey: c.conditionKey,
      isHealthy: c.isHealthy,
      names: c.names,
      description: c.description,
      symptoms: c.symptoms,
      management: c.management,
      reviewStatus: c.reviewStatus,
      reviewedBy: c.reviewedBy,
      reviewedAt: c.reviewedAt ? c.reviewedAt.toISOString() : null,
      sources: c.sources,
    }));
  }
}
