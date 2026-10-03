import { NotFoundError } from '../../../domain/errors/DomainError.js';

/**
 * Caso de uso para obtener el detalle y manejo de una condición por su classKey.
 */
export class GetCondition {
  /**
   * @param {object} dependencies
   * @param {import('../../ports/ConditionCatalogRepository.js').ConditionCatalogRepository} dependencies.conditionCatalogRepository
   */
  constructor({ conditionCatalogRepository }) {
    this.conditionCatalogRepository = conditionCatalogRepository;
  }

  /**
   * @param {string} classKey
   * @returns {Promise<object>}
   */
  async execute(classKey) {
    const condition = await this.conditionCatalogRepository.findByClassKey(classKey);

    if (!condition) {
      throw new NotFoundError(
        `La condición con clave '${classKey}' no existe en el catálogo.`,
        'CONDITION_NOT_FOUND'
      );
    }

    return {
      classKey: condition.classKey,
      cropKey: condition.cropKey,
      conditionKey: condition.conditionKey,
      isHealthy: condition.isHealthy,
      names: condition.names,
      description: condition.description,
      symptoms: condition.symptoms,
      management: condition.management,
      reviewStatus: condition.reviewStatus,
      reviewedBy: condition.reviewedBy,
      reviewedAt: condition.reviewedAt ? condition.reviewedAt.toISOString() : null,
      sources: condition.sources,
    };
  }
}
