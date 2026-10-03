import { ImageStorage } from '../../src/application/ports/ImageStorage.js';
import { NotFoundError } from '../../src/domain/errors/DomainError.js';

export class FakeImageStorage extends ImageStorage {
  constructor({ shouldFailOnSave = false } = {}) {
    super();
    /** @type {Map<string, Buffer>} */
    this.store = new Map();
    this.shouldFailOnSave = shouldFailOnSave;
  }

  async save(key, buffer) {
    if (this.shouldFailOnSave) {
      throw new Error('Fallo simulado al guardar imagen');
    }
    this.store.set(key, buffer);
    return key;
  }

  async get(key) {
    const buf = this.store.get(key);
    if (!buf) {
      throw new NotFoundError('Imagen no encontrada', 'IMAGE_NOT_FOUND');
    }
    return buf;
  }

  async delete(key) {
    this.store.delete(key);
  }

  has(key) {
    return this.store.has(key);
  }

  get size() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }
}
