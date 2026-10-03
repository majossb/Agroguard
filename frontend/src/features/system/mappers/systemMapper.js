/**
 * Mapper con lista blanca estricta para la información del sistema y modelo.
 */

/**
 * @param {object} rawHealth
 * @returns {{ isHealthy: boolean, status: string }}
 */
export function mapHealthResponse(rawHealth) {
  if (!rawHealth || typeof rawHealth !== 'object') {
    return { isHealthy: false, status: 'DOWN' };
  }

  const status = typeof rawHealth.status === 'string' ? rawHealth.status : 'DOWN';
  const isHealthy = status === 'UP';

  return {
    isHealthy,
    status,
  };
}

/**
 * @param {object} rawModel
 * @returns {{ name: string, version: string, classCount: number, dataset: string, metrics: object|null, evaluationNote: string }}
 */
export function mapModelInfoResponse(rawModel) {
  if (!rawModel || typeof rawModel !== 'object') {
    return {
      name: 'AgroGuard Model',
      version: '1.0',
      classCount: 38,
      dataset: 'PlantVillage Dataset',
      metrics: null,
      evaluationNote: 'Métricas pendientes de verificación independiente',
    };
  }

  return {
    name: typeof rawModel.name === 'string' ? rawModel.name : 'AgroGuard Model',
    version: typeof rawModel.version === 'string' ? rawModel.version : '1.0',
    classCount: typeof rawModel.classCount === 'number' ? rawModel.classCount : 38,
    dataset: typeof rawModel.dataset === 'string' ? rawModel.dataset : 'PlantVillage Dataset',
    metrics: rawModel.metrics && typeof rawModel.metrics === 'object' ? rawModel.metrics : null,
    evaluationNote:
      typeof rawModel.evaluationNote === 'string'
        ? rawModel.evaluationNote
        : 'Métricas pendientes de verificación con una evaluación reproducible',
  };
}
