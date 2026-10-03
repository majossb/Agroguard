import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { SharpImageProcessor } from '../../../src/infrastructure/image/SharpImageProcessor.js';

describe('Infrastructure — SharpImageProcessor', () => {
  const processor = new SharpImageProcessor({
    maxUploadMb: 2,
    maxInputPixels: 40000000,
  });

  it('Debe procesar y normalizar exitosamente una imagen válida (JPEG 500x500)', async () => {
    // Generar imagen JPEG válida con Sharp en memoria
    const validBuffer = await sharp({
      create: {
        width: 500,
        height: 500,
        channels: 3,
        background: { r: 50, g: 150, b: 50 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await processor.normalize(validBuffer);

    expect(result.mimeType).toBe('image/jpeg');
    expect(result.width).toBe(500);
    expect(result.height).toBe(500);
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(result.sha256).toHaveLength(64);
  });

  it('Debe procesar y convertir a JPEG una imagen PNG', async () => {
    const pngBuffer = await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 4,
        background: { r: 100, g: 200, b: 100, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const result = await processor.normalize(pngBuffer);

    expect(result.mimeType).toBe('image/jpeg');
    expect(result.width).toBe(400);
    expect(result.height).toBe(400);
  });

  it('Debe rechazar imágenes con resolución inferior a 224x224 con IMAGE_TOO_SMALL', async () => {
    const tinyBuffer = await sharp({
      create: {
        width: 150,
        height: 150,
        channels: 3,
        background: { r: 10, g: 10, b: 10 },
      },
    })
      .jpeg()
      .toBuffer();

    await expect(processor.normalize(tinyBuffer)).rejects.toMatchObject({
      code: 'IMAGE_TOO_SMALL',
    });
  });

  it('Debe rechazar archivos que no sean imágenes reales con IMAGE_INVALID_TYPE', async () => {
    const textBuffer = Buffer.from('esto no es una imagen');

    await expect(processor.normalize(textBuffer)).rejects.toMatchObject({
      code: 'IMAGE_INVALID_TYPE',
    });
  });

  it('Debe rechazar archivos nulos o vacíos con IMAGE_REQUIRED', async () => {
    await expect(processor.normalize(null)).rejects.toMatchObject({
      code: 'IMAGE_REQUIRED',
    });
    await expect(processor.normalize(Buffer.alloc(0))).rejects.toMatchObject({
      code: 'IMAGE_REQUIRED',
    });
  });

  it('Debe rechazar archivos que superen el límite de tamaño en bytes con IMAGE_TOO_LARGE', async () => {
    const tightProcessor = new SharpImageProcessor({ maxUploadMb: 0.0001 }); // ~104 bytes max
    const imageBuffer = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 3,
        background: { r: 100, g: 100, b: 100 },
      },
    })
      .jpeg()
      .toBuffer();

    await expect(tightProcessor.normalize(imageBuffer)).rejects.toMatchObject({
      code: 'IMAGE_TOO_LARGE',
    });
  });

});
