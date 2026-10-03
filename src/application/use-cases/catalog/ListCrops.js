/**
 * Caso de uso para listar todos los cultivos soportados por el modelo de IA.
 */
export class ListCrops {
  /**
   * @param {object} dependencies
   * @param {import('../../ports/ConditionCatalogRepository.js').ConditionCatalogRepository} dependencies.conditionCatalogRepository
   */
  constructor({ conditionCatalogRepository }) {
    this.conditionCatalogRepository = conditionCatalogRepository;
  }

  /**
   * @returns {Promise<Array<{ cropKey: string, cropName: string, conditionsCount: number }>>}
   */
  async execute() {
    return await this.conditionCatalogRepository.findCrops();
  }
}
