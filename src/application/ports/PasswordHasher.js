/**
 * Puerto para hashing y verificación de contraseñas.
 * @interface PasswordHasher
 */
export class PasswordHasher {
  /**
   * Genera un hash seguro para una contraseña en texto plano.
   * @param {string} plainPassword
   * @returns {Promise<string>}
   */
  async hash(_plainPassword) {
    throw new Error('Method hash() must be implemented');
  }

  /**
   * Compara una contraseña en texto plano contra un hash.
   * @param {string} plainPassword
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  async compare(_plainPassword, _hash) {
    throw new Error('Method compare() must be implemented');
  }
}
