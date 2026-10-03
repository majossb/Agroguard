/**
 * Puerto para obtener la fecha/hora actual de forma determinista.
 * @interface Clock
 */
export class Clock {
  /**
   * @returns {Date}
   */
  now() {
    throw new Error('Method now() must be implemented');
  }
}
