import crypto from 'crypto';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { ImageProcessor } from '../../application/ports/ImageProcessor.js';
import { InvalidImageError } from '../../domain/errors/DomainError.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Adaptador de procesamiento y normalización de imágenes utilizando Sharp.
 * @implements {ImageProcessor}
 */
export class SharpImageProcessor extends ImageProcessor {
  /**
   * @param {object} [options]
   * @param {number} [options.maxUploadMb=8]
   * @param {number} [options.maxInputPixels=40000000]
   */
  constructor({ maxUploadMb = 8, maxInputPixels = 40000000 } = {}) {
    super();
    this.maxUploadBytes = maxUploadMb * 1024 * 1024;
    this.maxInputPixels = maxInputPixels;
  }

  /**
   * Normaliza, valida y convierte la imagen a JPEG estándar sRGB sin metadatos.
   * @param {Buffer} buffer
   * @returns {Promise<import('../../application/ports/ImageProcessor.js').ProcessedImage>}
   */
  async normalize(buffer) {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw new InvalidImageError('Se requiere una imagen para el análisis.', 'IMAGE_REQUIRED');
    }

    if (buffer.length > this.maxUploadBytes) {
      throw new InvalidImageError(
        'El archivo de imagen supera el tamaño máximo permitido.',
        'IMAGE_TOO_LARGE'
      );
    }

    // Validación estricta de Magic Bytes
    const detectedType = await fileTypeFromBuffer(buffer);
    if (!detectedType || !ALLOWED_MIME_TYPES.has(detectedType.mime)) {
      throw new InvalidImageError(
        'El tipo de archivo no es compatible. Solo se permiten imágenes JPEG, PNG o WebP válidas.',
        'IMAGE_INVALID_TYPE'
      );
    }

    try {
      const pipeline = sharp(buffer, {
        limitInputPixels: this.maxInputPixels,
        failOnError: true,
      });

      const metadata = await pipeline.metadata();

      if (!metadata.width || !metadata.height) {
        throw new InvalidImageError(
          'La imagen no contiene dimensiones legibles o está corrupta.',
          'IMAGE_CORRUPT'
        );
      }

      const shortSide = Math.min(metadata.width, metadata.height);
      if (shortSide < 224) {
        throw new InvalidImageError(
          'La imagen es demasiado pequeña. Acércate a la hoja y vuelve a tomarla (resolución mínima: 224x224 px).',
          'IMAGE_TOO_SMALL'
        );
      }

      // Procesamiento: rotación EXIF, resize máx 1600px, JPEG 90, strip de metadatos (incluye GPS)
      const { data, info } = await pipeline
        .rotate()
        .resize({
          width: 1600,
          height: 1600,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 90,
          force: true,
        })
        .toBuffer({ resolveWithObject: true });

      const sha256 = crypto.createHash('sha256').update(data).digest('hex');

      return {
        buffer: data,
        mimeType: 'image/jpeg',
        width: info.width,
        height: info.height,
        sizeBytes: info.size,
        sha256,
      };
    } catch (error) {
      if (error instanceof InvalidImageError) {
        throw error;
      }

      const errMsg = error.message || '';
      if (errMsg.includes('pixel limit') || errMsg.includes('exceeds pixel limit')) {
        throw new InvalidImageError(
          'La imagen excede el límite máximo de resolución permitido. Reduce la resolución de tu cámara.',
          'IMAGE_TOO_LARGE'
        );
      }

      throw new InvalidImageError(
        `Error al decodificar y procesar la imagen: ${errMsg}`,
        'IMAGE_CORRUPT'
      );
    }
  }
}
