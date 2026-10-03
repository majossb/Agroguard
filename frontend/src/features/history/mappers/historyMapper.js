import { mapDiagnosisResponse } from '../../diagnosis/mappers/diagnosisMapper.js';

/**
 * Mappers con lista blanca estricta para el historial y retroalimentación de diagnósticos.
 */

/**
 * @param {any} raw
 * @returns {{ items: Array<object>, page: number, pageSize: number, totalItems: number, totalPages: number }}
 */
export function mapPaginatedDiagnosesResponse(raw) {
  if (!raw || typeof raw !== 'object') {
    return { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 1 };
  }

  const items = Array.isArray(raw.items)
    ? raw.items.map((item) => mapDiagnosisResponse(item))
    : [];

  return {
    items,
    page: typeof raw.page === 'number' ? Math.max(1, raw.page) : 1,
    pageSize: typeof raw.pageSize === 'number' ? Math.max(1, raw.pageSize) : 20,
    totalItems: typeof raw.totalItems === 'number' ? Math.max(0, raw.totalItems) : items.length,
    totalPages: typeof raw.totalPages === 'number' ? Math.max(1, raw.totalPages) : 1,
  };
}

/**
 * @param {any} raw
 * @returns {{ id: string, diagnosisId: string, wasCorrect: boolean, correctClassKey: string|null, comment: string|null, createdAt: string }}
 */
export function mapFeedbackResponse(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Respuesta de retroalimentación inválida.');
  }

  return {
    id: String(raw.id || ''),
    diagnosisId: String(raw.diagnosisId || ''),
    wasCorrect: Boolean(raw.wasCorrect),
    correctClassKey: typeof raw.correctClassKey === 'string' ? raw.correctClassKey : null,
    comment: typeof raw.comment === 'string' ? raw.comment : null,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
  };
}
