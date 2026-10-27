/**
 * @typedef {object} TopLabel
 * @property {string} label - Etiqueta CLIP
 * @property {number} score - Score entre 0 y 1
 */

/**
 * @typedef {object} ValidationResult
 * @property {string} state - 'ACEPTAR' | 'RECHAZAR' | 'REVISAR'
 * @property {string} reason - Motivo legible de la decisión
 * @property {TopLabel[]} topLabels - Top 3 etiquetas CLIP con scores
 */

/**
 * Puerto para comunicación con el servicio de validación visual CLIP.
 * Determina si una imagen corresponde a una hoja de planta antes de la inferencia.
 * @interface ImageValidator
 */
export class ImageValidator {
  /**
   * Valida una imagen contra el modelo CLIP.
   * @param {Buffer} imageBuffer - Buffer de la imagen normalizada
   * @returns {Promise<ValidationResult>}
   */
  async validate(_imageBuffer) {
    throw new Error('Method validate() must be implemented');
  }

  /**
   * Verifica la disponibilidad del servicio de validación.
   * @returns {Promise<boolean>}
   */
  async isReady() {
    throw new Error('Method isReady() must be implemented');
  }
}
