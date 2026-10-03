import { ValidationError } from '../errors/DomainError.js';

export const HEALTH_STATUS_VALUES = Object.freeze({
  HEALTHY: 'HEALTHY',
  DISEASED: 'DISEASED',
  INCONCLUSIVE: 'INCONCLUSIVE',
});

/**
 * Value Object inmutable para representar el estado de salud de la hoja.
 */
export class HealthStatus {
  /**
   * @param {'HEALTHY'|'DISEASED'|'INCONCLUSIVE'} value
   */
  constructor(value) {
    if (!Object.values(HEALTH_STATUS_VALUES).includes(value)) {
      throw new ValidationError(
        `Estado de salud '${value}' no válido. Opciones permitidas: ${Object.values(
          HEALTH_STATUS_VALUES
        ).join(', ')}`,
        'INVALID_HEALTH_STATUS'
      );
    }

    this.value = value;
    Object.freeze(this);
  }

  isHealthy() {
    return this.value === HEALTH_STATUS_VALUES.HEALTHY;
  }

  isDiseased() {
    return this.value === HEALTH_STATUS_VALUES.DISEASED;
  }

  isInconclusive() {
    return this.value === HEALTH_STATUS_VALUES.INCONCLUSIVE;
  }

  equals(other) {
    if (!other) return false;
    const otherVal = other instanceof HealthStatus ? other.value : String(other);
    return this.value === otherVal;
  }

  toString() {
    return this.value;
  }
}
