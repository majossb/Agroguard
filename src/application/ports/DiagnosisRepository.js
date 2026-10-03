/**
 * @typedef {object} DiagnosisFilters
 * @property {'HEALTHY'|'DISEASED'|'INCONCLUSIVE'} [healthStatus]
 * @property {string} [cropKey]
 * @property {Date} [from]
 * @property {Date} [to]
 */

/**
 * @typedef {object} PaginationParams
 * @property {number} page
 * @property {number} pageSize
 */

/**
 * @typedef {object} PaginatedResult<T>
 * @property {T[]} items
 * @property {number} page
 * @property {number} pageSize
 * @property {number} totalItems
 * @property {number} totalPages
 */

/**
 * Puerto de persistencia para diagnósticos.
 * @interface DiagnosisRepository
 */
export class DiagnosisRepository {
  /**
   * Guarda un nuevo diagnóstico o actualiza uno existente.
   * @param {import('../../domain/entities/Diagnosis.js').Diagnosis} diagnosis
   * @returns {Promise<import('../../domain/entities/Diagnosis.js').Diagnosis>}
   */
  async save(_diagnosis) {
    throw new Error('Method save() must be implemented');
  }

  /**
   * Busca un diagnóstico por su identificador.
   * @param {string} id
   * @returns {Promise<import('../../domain/entities/Diagnosis.js').Diagnosis|null>}
   */
  async findById(_id) {
    throw new Error('Method findById() must be implemented');
  }

  /**
   * Lista diagnósticos paginados y filtrados para un usuario propietario.
   * @param {string} ownerId
   * @param {DiagnosisFilters} [filters={}]
   * @param {PaginationParams} [pagination={ page: 1, pageSize: 20 }]
   * @returns {Promise<PaginatedResult<import('../../domain/entities/Diagnosis.js').Diagnosis>>}
   */
  async findByOwner(_ownerId, _filters = {}, _pagination = { page: 1, pageSize: 20 }) {
    throw new Error('Method findByOwner() must be implemented');
  }

  /**
   * Elimina un diagnóstico por su ID.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deleteById(_id) {
    throw new Error('Method deleteById() must be implemented');
  }

  /**
   * Elimina todos los diagnósticos de un usuario propietario.
   * @param {string} ownerId
   * @returns {Promise<number>}
   */
  async deleteByOwnerId(_ownerId) {
    throw new Error('Method deleteByOwnerId() must be implemented');
  }
}
