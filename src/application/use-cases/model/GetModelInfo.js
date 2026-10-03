/**
 * Caso de uso para obtener la información, versión y métricas del modelo de inferencia.
 */
export class GetModelInfo {
  /**
   * @param {object} dependencies
   * @param {import('../../ports/InferenceEngine.js').InferenceEngine} dependencies.inferenceEngine
   */
  constructor({ inferenceEngine }) {
    this.inferenceEngine = inferenceEngine;
  }

  /**
   * @returns {Promise<import('../../ports/InferenceEngine.js').ModelInfo>}
   */
  async execute() {
    return await this.inferenceEngine.info();
  }
}
