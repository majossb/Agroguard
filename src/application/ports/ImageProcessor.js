/**
 * @typedef {object} ProcessedImage
 * @property {Buffer} buffer - Buffer de imagen normalizada en formato JPEG
 * @property {'image/jpeg'} mimeType
 * @property {number} width
 * @property {number} height
 * @property {number} sizeBytes
 * @property {string} sha256 - Hash SHA-256 en hexadecimal
 */

/**
 * Puerto para validación, saneamiento y normalización de imágenes.
 * @interface ImageProcessor
 */
export class ImageProcessor {
  /**
   * Normaliza y valida una imagen enviada por el usuario.
   * @param {Buffer} buffer - Buffer de imagen cruda
   * @returns {Promise<ProcessedImage>}
   */
  async normalize(_buffer) {
    throw new Error('Method normalize() must be implemented');
  }
}
