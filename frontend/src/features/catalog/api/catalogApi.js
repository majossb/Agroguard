import { httpClient } from '../../../shared/api/httpClient.js';

export const catalogApi = {
  /**
   * Obtiene la lista de cultivos soportados y número de condiciones por cultivo
   * @returns {Promise<Array<object>>}
   */
  getCrops: () => httpClient('/catalog/crops'),

  /**
   * Obtiene la lista de condiciones con filtros opcionales
   * @param {{ cropKey?: string, isHealthy?: boolean }} [params]
   * @returns {Promise<Array<object>>}
   */
  getConditions: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.cropKey) searchParams.set('cropKey', params.cropKey);
    if (typeof params.isHealthy === 'boolean') searchParams.set('isHealthy', String(params.isHealthy));
    const query = searchParams.toString();
    return httpClient(`/catalog/conditions${query ? `?${query}` : ''}`);
  },

  /**
   * Obtiene el detalle completo de una condición por su classKey
   * @param {string} classKey - Ej: 'Tomato___Early_blight'
   * @returns {Promise<object>}
   */
  getCondition: (classKey) => httpClient(`/catalog/conditions/${encodeURIComponent(classKey)}`),
};
