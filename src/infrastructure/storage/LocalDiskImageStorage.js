import fs from 'fs/promises';
import path from 'path';
import { ImageStorage } from '../../application/ports/ImageStorage.js';
import { NotFoundError } from '../../domain/errors/DomainError.js';

/**
 * Adaptador de almacenamiento de imágenes en disco local.
 * @implements {ImageStorage}
 */
export class LocalDiskImageStorage extends ImageStorage {
  /**
   * @param {object} [options]
   * @param {string} [options.baseDir='uploads/images']
   */
  constructor({ baseDir = 'uploads/images' } = {}) {
    super();
    this.baseDir = path.resolve(process.cwd(), baseDir);
  }

  /**
   * Guarda una imagen en la ruta baseDir / key
   * @param {string} key - e.g. 'images/2026/09/uuid.jpg'
   * @param {Buffer} buffer
   * @returns {Promise<string>}
   */
  async save(key, buffer) {
    const fullPath = path.join(this.baseDir, key);
    const parentDir = path.dirname(fullPath);

    await fs.mkdir(parentDir, { recursive: true });
    await fs.writeFile(fullPath, buffer);

    return key;
  }

  /**
   * Lee la imagen del disco local
   * @param {string} key
   * @returns {Promise<Buffer>}
   */
  async get(key) {
    const fullPath = path.join(this.baseDir, key);
    try {
      return await fs.readFile(fullPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new NotFoundError('La imagen solicitada no existe en el almacenamiento', 'IMAGE_NOT_FOUND');
      }
      throw error;
    }
  }

  /**
   * Elimina la imagen del disco
   * @param {string} key
   * @returns {Promise<void>}
   */
  async delete(key) {
    const fullPath = path.join(this.baseDir, key);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      // Si el archivo ya no existe, ignoramos el error de forma idempotente
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
