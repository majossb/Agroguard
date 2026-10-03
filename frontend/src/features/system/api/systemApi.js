import { httpClient } from '../../../shared/api/httpClient.js';

/**
 * Peticiones HTTP del módulo de sistema y modelo de IA.
 */
export const systemApi = {
  /**
   * Consulta el estado de salud del sistema
   * @returns {Promise<object>}
   */
  getHealth: () => httpClient('/health'),

  /**
   * Consulta los metadatos técnicos del modelo de IA
   * @returns {Promise<object>}
   */
  getModelInfo: () => httpClient('/model/info'),
};
