/**
 * Mappers con lista blanca estricta para el catálogo fitopatológico.
 * Campos permitidos según el schema Condition y CropSummary del OpenAPI.
 */

/**
 * @param {any} rawCrops
 * @returns {Array<{ cropKey: string, cropName: string, conditionsCount: number }>}
 */
export function mapCropsResponse(rawCrops) {
  if (!Array.isArray(rawCrops)) {
    return [];
  }

  return rawCrops
    .filter((crop) => crop && typeof crop.cropKey === 'string')
    .map((crop) => ({
      cropKey: String(crop.cropKey),
      cropName: typeof crop.cropName === 'string' ? crop.cropName : String(crop.cropKey),
      conditionsCount: typeof crop.conditionsCount === 'number' ? crop.conditionsCount : 0,
    }));
}

/**
 * Mapea un ítem de la lista de condiciones (resumen).
 * @param {any} raw
 * @returns {{ classKey: string, cropKey: string, conditionKey: string, isHealthy: boolean, cropName: string, conditionName: string }}
 */
export function mapConditionSummary(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Condición del catálogo inválida.');
  }

  return {
    classKey: String(raw.classKey || ''),
    cropKey: String(raw.cropKey || ''),
    conditionKey: String(raw.conditionKey || ''),
    isHealthy: Boolean(raw.isHealthy),
    cropName: raw.names?.es?.cropName ?? raw.cropKey ?? '',
    conditionName: raw.names?.es?.conditionName ?? raw.conditionKey ?? '',
  };
}

/**
 * Mapea la lista completa de condiciones del catálogo.
 * @param {any} rawList
 * @returns {Array<ReturnType<typeof mapConditionSummary>>}
 */
export function mapConditionsResponse(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .filter((item) => item && typeof item.classKey === 'string')
    .map(mapConditionSummary);
}

/**
 * Mapea el detalle completo de una condición (incluyendo síntomas y manejo).
 * @param {any} raw
 * @returns {{
 *   classKey: string, cropKey: string, conditionKey: string, isHealthy: boolean,
 *   cropName: string, conditionName: string,
 *   description: string|null,
 *   symptoms: string[],
 *   management: { cultural: string[], biological: string[], chemical: string[] }
 * }}
 */
export function mapConditionDetail(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Detalle de condición inválido.');
  }

  const mgmt = raw.management && typeof raw.management === 'object' ? raw.management : {};

  return {
    classKey: String(raw.classKey || ''),
    cropKey: String(raw.cropKey || ''),
    conditionKey: String(raw.conditionKey || ''),
    isHealthy: Boolean(raw.isHealthy),
    cropName: raw.names?.es?.cropName ?? raw.cropKey ?? '',
    conditionName: raw.names?.es?.conditionName ?? raw.conditionKey ?? '',
    description: typeof raw.description === 'string' ? raw.description : null,
    symptoms: Array.isArray(raw.symptoms) ? raw.symptoms.filter((s) => typeof s === 'string') : [],
    management: {
      cultural: Array.isArray(mgmt.cultural) ? mgmt.cultural.filter((s) => typeof s === 'string') : [],
      biological: Array.isArray(mgmt.biological) ? mgmt.biological.filter((s) => typeof s === 'string') : [],
      chemical: Array.isArray(mgmt.chemical) ? mgmt.chemical.filter((s) => typeof s === 'string') : [],
    },
  };
}
