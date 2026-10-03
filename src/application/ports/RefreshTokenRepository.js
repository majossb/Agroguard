/**
 * @typedef {object} RefreshTokenData
 * @property {string} tokenHash - Hash SHA-256 del token opaco
 * @property {string} userId
 * @property {string} familyId - Identificador de familia para rotación
 * @property {Date} expiresAt
 * @property {Date|null} [revokedAt]
 * @property {string|null} [replacedBy]
 * @property {Date} createdAt
 */

/**
 * Puerto de repositorio para persistencia y rotación de refresh tokens.
 * @interface RefreshTokenRepository
 */
export class RefreshTokenRepository {
  /**
   * Guarda un nuevo refresh token.
   * @param {RefreshTokenData} tokenData
   * @returns {Promise<RefreshTokenData>}
   */
  async save(_tokenData) {
    throw new Error('Method save() must be implemented');
  }

  /**
   * Busca un token por su hash SHA-256.
   * @param {string} tokenHash
   * @returns {Promise<RefreshTokenData|null>}
   */
  async findByHash(_tokenHash) {
    throw new Error('Method findByHash() must be implemented');
  }

  /**
   * Marca un token como revocado y reemplazado.
   * @param {string} tokenHash
   * @param {string} replacedByHash
   * @returns {Promise<void>}
   */
  async revokeAndReplace(_tokenHash, _replacedByHash) {
    throw new Error('Method revokeAndReplace() must be implemented');
  }

  /**
   * Revoca todos los tokens de una familia (detección de reutilización).
   * @param {string} familyId
   * @returns {Promise<void>}
   */
  async revokeFamily(_familyId) {
    throw new Error('Method revokeFamily() must be implemented');
  }

  /**
   * Revoca todos los tokens de un usuario.
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async revokeAllForUser(_userId) {
    throw new Error('Method revokeAllForUser() must be implemented');
  }
}
