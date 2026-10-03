import { ClassKeyParser } from '../services/ClassKeyParser.js';

/**
 * Value Object inmutable para representar una clave de clase de cultivo y condición.
 */
export class ClassKey {
  /**
   * @param {string} value
   */
  constructor(value) {
    const parsed = ClassKeyParser.parse(value);
    this.value = parsed.classKey;
    this.cropKey = parsed.cropKey;
    this.conditionKey = parsed.conditionKey;
    this.isHealthy = parsed.isHealthy;
    this.cropName = parsed.cropName;
    this.conditionName = parsed.conditionName;

    Object.freeze(this);
  }

  equals(other) {
    if (!other) return false;
    const otherVal = other instanceof ClassKey ? other.value : String(other);
    return this.value === otherVal;
  }

  toString() {
    return this.value;
  }
}
