import { ValidationError } from '../errors/DomainError.js';

/**
 * Value Object inmutable para representar un nivel de confianza o probabilidad en [0, 1].
 */
export class Confidence {
  /**
   * @param {number} value
   */
  constructor(value) {
    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
      throw new ValidationError(
        'El nivel de confianza debe ser un número válido',
        'CONFIDENCE_INVALID_NUMBER'
      );
    }

    if (value < 0 || value > 1) {
      throw new ValidationError(
        `El nivel de confianza debe estar entre 0.0 y 1.0. Valor recibido: ${value}`,
        'CONFIDENCE_OUT_OF_RANGE'
      );
    }

    this.value = value;
    Object.freeze(this);
  }

  /**
   * Devuelve el valor con 4 decimales
   * @returns {number}
   */
  toRounded(decimals = 4) {
    return Number(this.value.toFixed(decimals));
  }

  /**
   * @param {Confidence|number} other
   * @returns {boolean}
   */
  greaterThanOrEqual(other) {
    const val = other instanceof Confidence ? other.value : other;
    return this.value >= val;
  }

  /**
   * @param {Confidence|number} other
   * @returns {boolean}
   */
  lessThan(other) {
    const val = other instanceof Confidence ? other.value : other;
    return this.value < val;
  }

  toString() {
    return this.value.toString();
  }
}
