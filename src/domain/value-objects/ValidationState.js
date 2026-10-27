/**
 * Value Object que representa el resultado de la validación visual CLIP.
 * Estados posibles: ACEPTAR, RECHAZAR, REVISAR.
 *
 * @immutable
 */
export class ValidationState {
  /** @type {string} */ #value;

  static ACEPTAR = 'ACEPTAR';
  static RECHAZAR = 'RECHAZAR';
  static REVISAR = 'REVISAR';

  static #VALID = new Set([
    ValidationState.ACEPTAR,
    ValidationState.RECHAZAR,
    ValidationState.REVISAR,
  ]);

  /**
   * @param {string} value
   */
  constructor(value) {
    if (!ValidationState.#VALID.has(value)) {
      throw new Error(
        `ValidationState inválido: '${value}'. Valores permitidos: ${[...ValidationState.#VALID].join(', ')}`
      );
    }
    this.#value = value;
    Object.freeze(this);
  }

  get value() {
    return this.#value;
  }

  isAccepted() {
    return this.#value === ValidationState.ACEPTAR;
  }

  isRejected() {
    return this.#value === ValidationState.RECHAZAR;
  }

  isReview() {
    return this.#value === ValidationState.REVISAR;
  }

  toString() {
    return this.#value;
  }

  toJSON() {
    return this.#value;
  }

  /**
   * @param {ValidationState} other
   * @returns {boolean}
   */
  equals(other) {
    if (!(other instanceof ValidationState)) return false;
    return this.#value === other.#value;
  }
}
