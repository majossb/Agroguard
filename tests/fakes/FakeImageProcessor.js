import { ImageProcessor } from '../../src/application/ports/ImageProcessor.js';
import { InvalidImageError } from '../../src/domain/errors/DomainError.js';
import crypto from 'crypto';

export class FakeImageProcessor extends ImageProcessor {
  constructor({ shouldFail = false, failCode = 'IMAGE_CORRUPT' } = {}) {
    super();
    this.shouldFail = shouldFail;
    this.failCode = failCode;
    this.lastBuffer = null;
  }

  async normalize(buffer) {
    this.lastBuffer = buffer;

    if (this.shouldFail) {
      throw new InvalidImageError('Imagen inválida simulada', this.failCode);
    }

    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    return {
      buffer,
      mimeType: 'image/jpeg',
      width: 800,
      height: 600,
      sizeBytes: buffer.length,
      sha256,
    };
  }
}
