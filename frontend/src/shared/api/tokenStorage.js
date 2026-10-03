/**
 * Almacén del token de acceso JWT estrictamente en memoria (seguridad contra XSS).
 * Nunca se persiste en localStorage, sessionStorage ni IndexedDB.
 */
let accessTokenInMemory = null;

export const tokenStorage = {
  /**
   * Obtiene el token de acceso actual
   * @returns {string|null}
   */
  getAccessToken: () => accessTokenInMemory,

  /**
   * Guarda el token de acceso en memoria
   * @param {string|null} token
   */
  setAccessToken: (token) => {
    accessTokenInMemory = typeof token === 'string' ? token : null;
  },

  /**
   * Elimina el token de memoria
   */
  clearAccessToken: () => {
    accessTokenInMemory = null;
  },
};
