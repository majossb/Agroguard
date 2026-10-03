/**
 * @typedef {object} CreateDiagnosisInput
 * @property {Buffer} imageBuffer - Buffer crudo de la imagen subida
 * @property {string|null} [ownerId=null] - ID del usuario si está autenticado
 * @property {string} [plotName]
 * @property {string} [cropHint]
 * @property {string} [notes]
 */

/**
 * @typedef {object} CreateDiagnosisOutput
 * @property {string|null} id
 * @property {boolean} persisted
 * @property {string} createdAt
 * @property {{
 *   healthStatus: 'HEALTHY'|'DISEASED'|'INCONCLUSIVE',
 *   confidence: number,
 *   healthyProbability: number
 * }} verdict
 * @property {{
 *   classKey: string,
 *   cropKey: string,
 *   conditionKey: string,
 *   cropName: string,
 *   conditionName: string
 * }} prediction
 * @property {Array<{ classKey: string, probability: number }>} topPredictions
 * @property {string[]} warnings
 * @property {string|null} message
 * @property {{
 *   reviewStatus: string,
 *   summary: string,
 *   generalAdvice: string,
 *   actions: Array<{ type: string, description: string }>
 * }|null} recommendation
 * @property {{
 *   name: string,
 *   version: string,
 *   provider: string
 * }} model
 * @property {number} processingTimeMs
 * @property {{
 *   url: string,
 *   width: number,
 *   height: number
 * }|null} image
 */

export {};
