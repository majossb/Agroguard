import { Email } from '../value-objects/Email.js';
import { ValidationError } from '../errors/DomainError.js';

export const USER_ROLES = Object.freeze({
  FARMER: 'FARMER',
});

/**
 * Entidad de Dominio User.
 */
export class User {
  /**
   * @param {object} params
   * @param {string} params.id
   * @param {Email|string} params.email
   * @param {string} params.passwordHash
   * @param {string} params.fullName
   * @param {'FARMER'} [params.role='FARMER']
   * @param {Date} [params.createdAt]
   */
  constructor({ id, email, passwordHash, fullName, role = USER_ROLES.FARMER, createdAt }) {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('El ID de usuario es obligatorio', 'USER_ID_REQUIRED');
    }
    if (!passwordHash || typeof passwordHash !== 'string') {
      throw new ValidationError('El hash de contraseña es obligatorio', 'USER_PASSWORD_HASH_REQUIRED');
    }
    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      throw new ValidationError('El nombre completo es obligatorio', 'USER_NAME_REQUIRED');
    }
    if (role !== USER_ROLES.FARMER) {
      throw new ValidationError(`Rol inválido '${role}'. En v1 solo se soporta FARMER.`, 'USER_ROLE_INVALID');
    }

    this.id = id;
    this.email = email instanceof Email ? email : new Email(email);
    this.passwordHash = passwordHash;
    this.fullName = fullName.trim();
    this.role = role;
    this.createdAt = createdAt || new Date();

    Object.freeze(this);
  }
}
