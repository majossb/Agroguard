import bcrypt from 'bcryptjs';
import { PasswordHasher } from '../../application/ports/PasswordHasher.js';

const SALT_ROUNDS = 12;

/**
 * Adaptador para hashing seguro de contraseñas con bcryptjs.
 * @implements {PasswordHasher}
 */
export class BcryptPasswordHasher extends PasswordHasher {
  /**
   * Genera el hash de una contraseña usando salt cost 12.
   * @param {string} plainPassword
   * @returns {Promise<string>}
   */
  async hash(plainPassword) {
    return await bcrypt.hash(plainPassword, SALT_ROUNDS);
  }

  /**
   * Compara una contraseña en texto plano con un hash bcrypt.
   * @param {string} plainPassword
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  async compare(plainPassword, hash) {
    if (!plainPassword || !hash) return false;
    return await bcrypt.compare(plainPassword, hash);
  }
}
