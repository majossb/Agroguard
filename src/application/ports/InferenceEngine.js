/**
 * @typedef {object} ClassProbability
 * @property {string} classKey - Identificador de clase (e.g. Tomato___Early_blight)
 * @property {number} probability - Probabilidad entre 0 y 1
 */

/**
 * @typedef {object} InferenceResult
 * @property {string} modelName
 * @property {string} modelVersion
 * @property {'mock'|'http'} provider
 * @property {ClassProbability[]} probabilities
 * @property {number} inferenceTimeMs
 * @property {null} explanation - Reservado para futuro mapa de calor Grad-CAM
 */

/**
 * @typedef {object} ModelInfo
 * @property {string} name
 * @property {string} version
 * @property {number} inputSize
 * @property {number} classCount
 * @property {string} dataset
 * @property {object|null} metrics
 * @property {string} [evaluationNote]
 */

/**
 * Puerto para comunicación con motores de inferencia de visión artificial.
 * @interface InferenceEngine
 */
export class InferenceEngine {
  /**
   * Ejecuta la predicción sobre una imagen normalizada en buffer JPEG.
   * @param {{ buffer: Buffer, mimeType: 'image/jpeg' }} image
   * @returns {Promise<InferenceResult>}
   */
  async predict(_image) {
    throw new Error('Method predict() must be implemented');
  }

  /**
   * Obtiene la información y metadatos del modelo de inferencia.
   * @returns {Promise<ModelInfo>}
   */
  async info() {
    throw new Error('Method info() must be implemented');
  }

  /**
   * Verifica la disponibilidad del motor.
   * @returns {Promise<boolean>}
   */
  async isReady() {
    throw new Error('Method isReady() must be implemented');
  }
}
