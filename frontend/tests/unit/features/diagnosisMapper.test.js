import { describe, it, expect } from 'vitest';
import { mapDiagnosisResponse } from '../../../src/features/diagnosis/mappers/diagnosisMapper.js';

describe('Features/Diagnosis — diagnosisMapper (Lista blanca estricta)', () => {
  const rawApiDto = {
    id: 'diag-1234',
    persisted: true,
    createdAt: '2026-09-20T12:00:00.000Z',
    verdict: {
      healthStatus: 'HEALTHY',
      confidence: 0.982,
      healthyProbability: 0.982,
    },
    prediction: {
      classKey: 'Tomato___healthy',
      cropKey: 'Tomato',
      conditionKey: 'healthy',
      cropName: 'Tomate',
      conditionName: 'Sana',
    },
    topPredictions: [
      { classKey: 'Tomato___healthy', probability: 0.982, cropName: 'Tomate', conditionName: 'Sana' },
    ],
    warnings: ['LOW_RESOLUTION'],
    recommendation: {
      reviewStatus: 'PENDING_REVIEW',
      summary: 'Mantener monitoreo regular.',
      generalAdvice: 'No requiere tratamiento.',
      actions: [{ type: 'cultural', description: 'Revisión semanal' }],
    },
    model: {
      name: 'ResNet50',
      version: '1.0.0',
      provider: 'mock',
    },
    processingTimeMs: 45,
    context: {
      plotName: 'Parcela A',
      cropHint: 'Tomato',
      notes: 'Hojas verdes normales',
    },
    image: {
      url: '/uploads/images/leaf.jpg',
      width: 500,
      height: 500,
    },
    // Campos no permitidos / internos de base de datos que deben ser ignorados por la lista blanca
    __v: 0,
    _id: 'internal_mongo_id',
    ownerId: 'secret-owner-id',
    serverIp: '192.168.1.1',
  };

  it('Mapea únicamente los campos permitidos y filtra propiedades desconocidas o internas', () => {
    const viewModel = mapDiagnosisResponse(rawApiDto);

    expect(viewModel.id).toBe('diag-1234');
    expect(viewModel.persisted).toBe(true);
    expect(viewModel.verdict.healthStatus).toBe('HEALTHY');
    expect(viewModel.verdict.confidence).toBe(0.982);
    expect(viewModel.prediction.cropName).toBe('Tomate');
    expect(viewModel.model.isMock).toBe(true);
    expect(viewModel.recommendation.reviewStatus).toBe('PENDING_REVIEW');

    // Comprobar que no existen campos internos
    expect(viewModel.__v).toBeUndefined();
    expect(viewModel._id).toBeUndefined();
    expect(viewModel.ownerId).toBeUndefined();
    expect(viewModel.serverIp).toBeUndefined();
  });

  it('Lanza error si el DTO es nulo o inválido', () => {
    expect(() => mapDiagnosisResponse(null)).toThrow();
    expect(() => mapDiagnosisResponse('invalido')).toThrow();
  });
});
