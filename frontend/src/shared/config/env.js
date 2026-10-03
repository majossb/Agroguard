/**
 * Configuración de variables de entorno públicas del frontend.
 */
export const ENV = Object.freeze({
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  MAX_UPLOAD_MB: Number(import.meta.env.VITE_MAX_UPLOAD_MB) || 8,
  IS_DEV: import.meta.env.DEV,
});
