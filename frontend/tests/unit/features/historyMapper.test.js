import { describe, it, expect } from 'vitest';
import { mapPaginatedDiagnosesResponse, mapFeedbackResponse } from '../../../src/features/history/mappers/historyMapper.js';

describe('Features/History — historyMapper (Lista blanca estricta)', () => {
  const rawItem = {
    id: 'diag-abc',
    persisted: true,
    createdAt: '2026-09-20T10:00:00.000Z',
    verdict: { healthStatus: 'DISEASED', confidence: 0.9, healthyProbability: 0.05 },
    prediction: {
      classKey: 'Tomato___Early_blight',
      cropKey: 'Tomato',
      conditionKey: 'Early_blight',
      cropName: 'Tomate',
      conditionName: 'Tizón temprano',
    },
    topPredictions: [],
    warnings: [],
    recommendation: null,
    model: { name: 'MockModel', version: '1.0', provider: 'mock' },
    processingTimeMs: 100,
    context: { plotName: 'Lote 1', cropHint: 'Tomato', notes: null },
    image: null,
    ownerId: 'secret-owner',     // Campo interno que debe ser filtrado
    internalHash: 'secret-hash', // Campo interno que debe ser filtrado
  };

  it('Mapea una respuesta paginada con items y metadatos de paginación', () => {
    const raw = {
      items: [rawItem],
      page: 2,
      pageSize: 12,
      totalItems: 25,
      totalPages: 3,
    };

    const result = mapPaginatedDiagnosesResponse(raw);

    expect(result.items).toHaveLength(1);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(12);
    expect(result.totalItems).toBe(25);
    expect(result.totalPages).toBe(3);

    // Cada item pasa por mapDiagnosisResponse — no debe tener campos internos
    expect(result.items[0].ownerId).toBeUndefined();
    expect(result.items[0].internalHash).toBeUndefined();
    expect(result.items[0].verdict.healthStatus).toBe('DISEASED');
  });

  it('Devuelve estructura vacía ante respuesta nula o malformada', () => {
    const result = mapPaginatedDiagnosesResponse(null);

    expect(result.items).toHaveLength(0);
    expect(result.page).toBe(1);
    expect(result.totalItems).toBe(0);
  });

  it('Mapea la respuesta de feedback filtrando campos desconocidos', () => {
    const raw = {
      id: 'fb-001',
      diagnosisId: 'diag-abc',
      wasCorrect: false,
      correctClassKey: 'Tomato___healthy',
      comment: 'Era una deficiencia nutricional',
      createdAt: '2026-09-20T11:00:00.000Z',
      internalAuditLog: 'secret-log', // Campo interno — debe filtrarse
    };

    const fb = mapFeedbackResponse(raw);

    expect(fb.id).toBe('fb-001');
    expect(fb.wasCorrect).toBe(false);
    expect(fb.correctClassKey).toBe('Tomato___healthy');
    expect(fb.comment).toBe('Era una deficiencia nutricional');
    expect(fb.internalAuditLog).toBeUndefined();
  });

  it('Lanza error si la respuesta de feedback está vacía o es inválida', () => {
    expect(() => mapFeedbackResponse(null)).toThrow();
    expect(() => mapFeedbackResponse('invalido')).toThrow();
  });
});
