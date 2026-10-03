/**
 * @typedef {object} TokenPayload
 * @property {string} userId
 * @property {string} role
 * @property {string} email
 */

/**
 * Puerto para generación y verificación de tokens JWT y opacos.
 * @interface TokenService
 */
export class TokenService {
  /**
   * Genera un Access Token JWT.
   * @param {TokenPayload} payload
   * @returns {string}
   */
  generateAccessToken(_payload) {
    throw new Error('Method generateAccessToken() must be implemented');
  }

  /**
   * Verifica un Access Token JWT.
   * @param {string} token
   * @returns {TokenPayload}
   */
  verifyAccessToken(_token) {
    throw new Error('Method verifyAccessToken() must be implemented');
  }

  /**
   * Genera un Refresh Token opaco y criptográficamente seguro (256 bits).
   * @returns {{ token: string, tokenHash: string }}
   */
  generateOpaqueRefreshToken() {
    throw new Error('Method generateOpaqueRefreshToken() must be implemented');
  }

  /**
   * Calcula el hash SHA-256 de un token opaco.
   * @param {string} token
   * @returns {string}
   */
  hashOpaqueToken(_token) {
    throw new Error('Method hashOpaqueToken() must be implemented');
  }
}
