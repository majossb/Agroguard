import { ValidationError } from '../errors/DomainError.js';

/**
 * Value Object inmutable para emails.
 */
export class Email {
  /**
   * @param {string} value
   */
  constructor(value) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new ValidationError('El correo electrónico es obligatorio', 'EMAIL_REQUIRED');
    }

    const normalized = value.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalized) || normalized.length > 255) {
      throw new ValidationError(
        'El formato del correo electrónico es inválido',
        'EMAIL_INVALID_FORMAT'
      );
    }

    this.value = normalized;
    Object.freeze(this);
  }

  /**
   * @param {Email|string} other
   * @returns {boolean}
   */
  equals(other) {
    if (!other) return false;
    const otherValue = other instanceof Email ? other.value : String(other).trim().toLowerCase();
    return this.value === otherValue;
  }

  toString() {
    return this.value;
  }
}
