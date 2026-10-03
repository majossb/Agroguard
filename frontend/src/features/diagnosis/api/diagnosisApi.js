import { httpClient } from '../../../shared/api/httpClient.js';

export const diagnosisApi = {
  /**
   * Envía una fotografía y datos opcionales de campo para diagnóstico fitopatológico
   * @param {FormData} formData
   * @param {AbortSignal} [signal]
   * @returns {Promise<object>}
   */
  createDiagnosis: (formData, signal) =>
    httpClient('/diagnoses', {
      method: 'POST',
      body: formData,
      signal,
    }),
};
