/**
 * Puerto de repositorio para feedback de diagnósticos.
 * @interface FeedbackRepository
 */
export class FeedbackRepository {
  /**
   * Guarda el feedback para un diagnóstico.
   * @param {import('../../domain/entities/Feedback.js').Feedback} feedback
   * @returns {Promise<import('../../domain/entities/Feedback.js').Feedback>}
   */
  async save(_feedback) {
    throw new Error('Method save() must be implemented');
  }

  /**
   * Busca el feedback correspondiente a un diagnóstico.
   * @param {string} diagnosisId
   * @returns {Promise<import('../../domain/entities/Feedback.js').Feedback|null>}
   */
  async findByDiagnosisId(_diagnosisId) {
    throw new Error('Method findByDiagnosisId() must be implemented');
  }

  /**
   * Elimina el feedback de un diagnóstico.
   * @param {string} diagnosisId
   * @returns {Promise<boolean>}
   */
  async deleteByDiagnosisId(_diagnosisId) {
    throw new Error('Method deleteByDiagnosisId() must be implemented');
  }

  /**
   * Elimina todos los feedbacks creados por un usuario.
   * @param {string} ownerId
   * @returns {Promise<number>}
   */
  async deleteByOwnerId(_ownerId) {
    throw new Error('Method deleteByOwnerId() must be implemented');
  }
}
