import { httpClient } from '../../../shared/api/httpClient.js';

export const historyApi = {
  /**
   * Obtiene la lista paginada de diagnósticos del usuario autenticado
   * @param {{ page?: number, pageSize?: number, healthStatus?: string, cropKey?: string, from?: string, to?: string }} [params={}]
   * @returns {Promise<object>}
   */
  listDiagnoses: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params.healthStatus) searchParams.set('healthStatus', params.healthStatus);
    if (params.cropKey) searchParams.set('cropKey', params.cropKey);
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);

    const query = searchParams.toString();
    return httpClient(`/diagnoses${query ? `?${query}` : ''}`);
  },

  /**
   * Obtiene el detalle completo de un diagnóstico por su identificador UUID
   * @param {string} id
   * @returns {Promise<object>}
   */
  getDiagnosis: (id) => httpClient(`/diagnoses/${id}`),

  /**
   * Elimina permanentemente un diagnóstico, su imagen y su feedback
   * @param {string} id
   * @returns {Promise<null>}
   */
  deleteDiagnosis: (id) =>
    httpClient(`/diagnoses/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Envía retroalimentación sobre la certeza en campo del diagnóstico
   * @param {string} id
   * @param {{ wasCorrect: boolean, correctClassKey?: string, comment?: string }} data
   * @returns {Promise<object>}
   */
  submitFeedback: (id, data) =>
    httpClient(`/diagnoses/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Actualiza el nombre del lote y las observaciones de campo
   * @param {string} id
   * @param {{ plotName?: string, notes?: string }} data
   * @returns {Promise<object>}
   */
  updateNotes: (id, data) =>
    httpClient(`/diagnoses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * Descarga la imagen binaria del diagnóstico
   * @param {string} id
   * @returns {Promise<Blob>}
   */
  downloadImageBlob: (id) => httpClient(`/diagnoses/${id}/image`),
};
