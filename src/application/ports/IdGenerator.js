/**
 * Puerto para generar identificadores únicos de forma desacoplada.
 * @interface IdGenerator
 */
export class IdGenerator {
  /**
   * @returns {string}
   */
  generate() {
    throw new Error('Method generate() must be implemented');
  }
}
