import { ValidationError } from '../errors/DomainError.js';

/**
 * Value Object inmutable para representar la información y metadatos de una imagen procesada.
 */
export class ImageInfo {
  /**
   * @param {object} params
   * @param {string|null} params.storageKey - Clave en el almacenamiento de archivos (o null si no está persistida)
   * @param {string} params.mimeType - Tipo MIME (e.g. 'image/jpeg')
   * @param {number} params.sizeBytes - Tamaño en bytes
   * @param {number} params.width - Ancho en píxeles
   * @param {number} params.height - Alto en píxeles
   * @param {string} params.sha256 - Hash SHA-256 del buffer procesado
   */
  constructor({ storageKey, mimeType, sizeBytes, width, height, sha256 }) {
    if (typeof mimeType !== 'string' || !mimeType.startsWith('image/')) {
      throw new ValidationError('MimeType de imagen inválido', 'IMAGE_INFO_INVALID_MIME');
    }
    if (typeof sizeBytes !== 'number' || sizeBytes <= 0) {
      throw new ValidationError('El tamaño en bytes de la imagen debe ser positivo', 'IMAGE_INFO_INVALID_SIZE');
    }
    if (typeof width !== 'number' || width <= 0 || typeof height !== 'number' || height <= 0) {
      throw new ValidationError('Las dimensiones de la imagen deben ser números positivos', 'IMAGE_INFO_INVALID_DIMENSIONS');
    }
    if (typeof sha256 !== 'string' || sha256.length !== 64) {
      throw new ValidationError('El hash SHA-256 de la imagen es inválido', 'IMAGE_INFO_INVALID_HASH');
    }

    this.storageKey = storageKey || null;
    this.mimeType = mimeType;
    this.sizeBytes = sizeBytes;
    this.width = width;
    this.height = height;
    this.sha256 = sha256;

    Object.freeze(this);
  }
}
