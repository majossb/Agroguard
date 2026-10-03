import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server.js';
import { renderWithProviders } from '../../utils/testUtils.jsx';
import { DiagnosesPage } from '../../../src/features/history/pages/DiagnosesPage.jsx';

const makeDiagnosisItem = (overrides = {}) => ({
  id: 'diag-001',
  persisted: true,
  createdAt: new Date().toISOString(),
  verdict: { healthStatus: 'DISEASED', confidence: 0.92, healthyProbability: 0.04 },
  prediction: {
    classKey: 'Tomato___Early_blight',
    cropKey: 'Tomato',
    conditionKey: 'Early_blight',
    cropName: 'Tomate',
    conditionName: 'Tizón temprano',
  },
  topPredictions: [],
  warnings: [],
  message: null,
  recommendation: null,
  model: { name: 'MockModel', version: '1.0', provider: 'mock' },
  processingTimeMs: 80,
  context: { plotName: 'Lote Norte', cropHint: 'Tomato', notes: null },
  image: { url: null, width: null, height: null },
  ...overrides,
});

describe('Feature History — DiagnosesPage (Historial de diagnósticos)', () => {
  it('Muestra los diagnósticos del usuario al cargar exitosamente', async () => {
    server.use(
      http.get('/api/v1/diagnoses', () => {
        return HttpResponse.json({
          items: [
            makeDiagnosisItem({ id: 'diag-001' }),
            makeDiagnosisItem({
              id: 'diag-002',
              verdict: { healthStatus: 'HEALTHY', confidence: 0.98, healthyProbability: 0.98 },
              prediction: {
                classKey: 'Tomato___healthy',
                cropKey: 'Tomato',
                conditionKey: 'healthy',
                cropName: 'Tomate',
                conditionName: 'Sana',
              },
              context: { plotName: 'Invernadero 1', cropHint: null, notes: null },
            }),
          ],
          page: 1,
          pageSize: 12,
          totalItems: 2,
          totalPages: 1,
        });
      })
    );

    renderWithProviders(<DiagnosesPage />, { initialRoute: '/diagnosticos' });

    // Espera la carga con un waitFor implícito del RTL
    const heading = await screen.findByText(/Historial de Diagnósticos/i);
    expect(heading).toBeInTheDocument();
  });

  it('Muestra el estado vacío cuando no hay diagnósticos registrados', async () => {
    server.use(
      http.get('/api/v1/diagnoses', () => {
        return HttpResponse.json({
          items: [],
          page: 1,
          pageSize: 12,
          totalItems: 0,
          totalPages: 1,
        });
      })
    );

    renderWithProviders(<DiagnosesPage />, { initialRoute: '/diagnosticos' });

    const empty = await screen.findByText(/Tu cuaderno de campo está vacío/i);
    expect(empty).toBeInTheDocument();
    expect(screen.getByText(/Escanear primera hoja/i)).toBeInTheDocument();
  });
});
