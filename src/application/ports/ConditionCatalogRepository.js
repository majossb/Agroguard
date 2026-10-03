/**
 * @typedef {object} ConditionFilters
 * @property {string} [cropKey]
 * @property {boolean} [isHealthy]
 */

/**
 * Puerto de repositorio para el catálogo de condiciones y cultivos.
 * @interface ConditionCatalogRepository
 */
export class ConditionCatalogRepository {
  /**
   * Busca una condición por su classKey exacto.
   * @param {string} classKey
   * @returns {Promise<import('../../domain/entities/Condition.js').Condition|null>}
   */
  async findByClassKey(_classKey) {
    throw new Error('Method findByClassKey() must be implemented');
  }

  /**
   * Lista todas las condiciones del catálogo con filtros opcionales.
   * @param {ConditionFilters} [filters={}]
   * @returns {Promise<import('../../domain/entities/Condition.js').Condition[]>}
   */
  async findAll(_filters = {}) {
    throw new Error('Method findAll() must be implemented');
  }

  /**
   * Obtiene la lista única de cultivos soportados con sus metadatos.
   * @returns {Promise<Array<{ cropKey: string, cropName: string, conditionsCount: number }>>}
   */
  async findCrops() {
    throw new Error('Method findCrops() must be implemented');
  }

  /**
   * Guarda o actualiza una condición en el catálogo (idempotente).
   * @param {import('../../domain/entities/Condition.js').Condition} condition
   * @returns {Promise<import('../../domain/entities/Condition.js').Condition>}
   */
  async save(_condition) {
    throw new Error('Method save() must be implemented');
  }
}
