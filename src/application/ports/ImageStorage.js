/**
 * Puerto para persistencia y recuperación de imágenes en almacenamiento de archivos.
 * @interface ImageStorage
 */
export class ImageStorage {
  /**
   * Guarda una imagen en el almacenamiento.
   * @param {string} key - Clave única de almacenamiento (e.g. images/2026/09/uuid.jpg)
   * @param {Buffer} buffer - Buffer de la imagen
   * @returns {Promise<string>} - Clave final de almacenamiento
   */
  async save(_key, _buffer) {
    throw new Error('Method save() must be implemented');
  }

  /**
   * Obtiene una imagen por su clave.
   * @param {string} key
   * @returns {Promise<Buffer>}
   */
  async get(_key) {
    throw new Error('Method get() must be implemented');
  }

  /**
   * Elimina una imagen por su clave.
   * @param {string} key
   * @returns {Promise<void>}
   */
  async delete(_key) {
    throw new Error('Method delete() must be implemented');
  }
}
