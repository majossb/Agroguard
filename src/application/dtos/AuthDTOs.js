/**
 * @typedef {object} RegisterUserInput
 * @property {string} email
 * @property {string} password
 * @property {string} fullName
 */

/**
 * @typedef {object} LoginUserInput
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {object} AuthResponseDTO
 * @property {string} accessToken
 * @property {string} opaqueRefreshToken
 * @property {{
 *   id: string,
 *   email: string,
 *   fullName: string,
 *   role: string,
 *   createdAt: string
 * }} user
 */

export {};
