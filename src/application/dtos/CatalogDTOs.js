/**
 * @typedef {object} ConditionDTO
 * @property {string} classKey
 * @property {string} cropKey
 * @property {string} conditionKey
 * @property {boolean} isHealthy
 * @property {string} cropName
 * @property {string} conditionName
 * @property {string} description
 * @property {string[]} symptoms
 * @property {{ cultural: string[], biological: string[], chemical: string[] }} management
 * @property {string} reviewStatus
 * @property {string|null} reviewedBy
 * @property {string|null} reviewedAt
 * @property {string[]} sources
 */

/**
 * @typedef {object} CropDTO
 * @property {string} cropKey
 * @property {string} cropName
 * @property {number} conditionsCount
 */

export {};
