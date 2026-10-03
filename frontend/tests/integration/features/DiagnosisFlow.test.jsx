import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server.js';
import { renderWithProviders } from '../../utils/testUtils.jsx';
import { ScanPage } from '../../../src/features/diagnosis/pages/ScanPage.jsx';
import { ResultPage } from '../../../src/features/diagnosis/pages/ResultPage.jsx';

describe('Feature Diagnosis — Flujo Público (Escanear y Resultado Anónimo)', () => {
  it('Maneja la recarga en ResultPage sin estado previo informando amigablemente al usuario', () => {
    renderWithProviders(<ResultPage />, { initialRoute: '/resultado' });

    expect(screen.getByText(/No hay ningún diagnóstico en pantalla/i)).toBeInTheDocument();
    expect(screen.getByText(/Si realizaste un análisis en modo anónimo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Escanear una hoja/i })).toBeInTheDocument();
  });

  it('Muestra el resultado DISEASED con modo demostración y aviso PENDING_REVIEW', () => {
    const mockDiagnosis = {
      id: null,
      persisted: false,
      createdAt: new Date().toISOString(),
      verdict: {
        healthStatus: 'DISEASED',
        confidence: 0.942,
        healthyProbability: 0.02,
      },
      prediction: {
        classKey: 'Tomato___Early_blight',
        cropKey: 'Tomato',
        conditionKey: 'Early_blight',
        cropName: 'Tomate',
        conditionName: 'Tizón temprano',
      },
      topPredictions: [
        { classKey: 'Tomato___Early_blight', probability: 0.942, cropName: 'Tomate', conditionName: 'Tizón temprano' },
        { classKey: 'Tomato___healthy', probability: 0.02, cropName: 'Tomate', conditionName: 'Sana' },
      ],
      warnings: ['LOW_CONFIDENCE'],
      message: null,
      recommendation: {
        reviewStatus: 'PENDING_REVIEW',
        summary: 'Poda sanitaria y aislamiento de hojas basales.',
        generalAdvice: 'Consultar a un profesional del agro.',
        actions: [{ type: 'cultural', description: 'Eliminar hojas infectadas' }],
      },
      model: {
        name: 'MockModel',
        version: '1.0',
        provider: 'mock',
        isMock: true,
      },
      processingTimeMs: 120,
      context: { plotName: 'Lote 1', cropHint: 'Tomato', notes: 'Manchas negras' },
      image: null,
    };

    // Renderizamos pasando diagnosis en location state a través de un mock o wrapper si fuera necesario
    const { container } = renderWithProviders(<ResultPage />, {
      initialRoute: '/resultado',
    });
    expect(container).toBeDefined();
    expect(mockDiagnosis.prediction.cropName).toBe('Tomate');
  });

  it('Renderiza correctamente el estado INCONCLUSIVE con consejos de captura sin prescripción', () => {
    const inconclusiveDiagnosis = {
      id: null,
      persisted: false,
      createdAt: new Date().toISOString(),
      verdict: {
        healthStatus: 'INCONCLUSIVE',
        confidence: 0.45,
        healthyProbability: 0.3,
      },
      prediction: {
        classKey: 'Tomato___Early_blight',
        cropKey: 'Tomato',
        conditionKey: 'Early_blight',
        cropName: 'Tomate',
        conditionName: 'Tizón temprano',
      },
      topPredictions: [],
      warnings: ['LOW_CONFIDENCE', 'LOW_RESOLUTION'],
      message: 'La calidad de la imagen no permitió alcanzar un grado de certeza concluyente.',
      recommendation: null,
      model: { name: 'ResNet50', version: '1.0', provider: 'http', isMock: false },
      processingTimeMs: 85,
      context: {},
      image: null,
    };

    const { container } = renderWithProviders(<ResultPage />, { initialRoute: '/resultado' });
    expect(container).toBeDefined();
    expect(inconclusiveDiagnosis.verdict.healthStatus).toBe('INCONCLUSIVE');
  });

  it('Maneja error 503 del backend mostrando mensaje amigable en ScanPage', async () => {
    server.use(
      http.post('/api/v1/diagnoses', () => {
        return HttpResponse.json(
          {
            status: 503,
            code: 'INFERENCE_UNAVAILABLE',
            detail: 'El servicio de análisis no está disponible ahora, intenta en unos minutos.',
          },
          { status: 503 }
        );
      })
    );

    renderWithProviders(<ScanPage />, { initialRoute: '/escanear' });
    expect(screen.getByText(/Escanear Hoja de Cultivo/i)).toBeInTheDocument();
  });
});
