import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server.js';
import { renderWithProviders } from '../../utils/testUtils.jsx';
import { CatalogPage } from '../../../src/features/catalog/pages/CatalogPage.jsx';

const mockCrops = [
  { cropKey: 'Tomato', cropName: 'Tomate', conditionsCount: 2 },
  { cropKey: 'Potato', cropName: 'Papa', conditionsCount: 1 },
];

const mockConditions = [
  {
    classKey: 'Tomato___Early_blight',
    cropKey: 'Tomato',
    conditionKey: 'Early_blight',
    isHealthy: false,
    names: {
      es: { cropName: 'Tomate', conditionName: 'Tizón temprano' },
    },
  },
  {
    classKey: 'Tomato___healthy',
    cropKey: 'Tomato',
    conditionKey: 'healthy',
    isHealthy: true,
    names: {
      es: { cropName: 'Tomate', conditionName: 'Sana' },
    },
  },
];

describe('Feature Catalog — CatalogPage (Exploración de cultivos y condiciones)', () => {
  it('Carga y muestra las condiciones saludables y enfermedades en secciones separadas', async () => {
    server.use(
      http.get('/api/v1/catalog/crops', () => {
        return HttpResponse.json(mockCrops);
      }),
      http.get('/api/v1/catalog/conditions', () => {
        return HttpResponse.json(mockConditions);
      })
    );

    renderWithProviders(<CatalogPage />, { initialRoute: '/catalogo' });

    // Esperar a que carguen los títulos y las tarjetas
    const diseasedHeading = await screen.findByRole('heading', { name: /Enfermedades y Plagas/i });
    expect(diseasedHeading).toBeInTheDocument();

    const healthyHeading = await screen.findByRole('heading', { name: /Estado Saludable/i });
    expect(healthyHeading).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Tizón temprano' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sana' })).toBeInTheDocument();
  });

  it('Muestra estado amigable si no hay condiciones para el filtro', async () => {
    server.use(
      http.get('/api/v1/catalog/crops', () => {
        return HttpResponse.json(mockCrops);
      }),
      http.get('/api/v1/catalog/conditions', () => {
        return HttpResponse.json([]);
      })
    );

    renderWithProviders(<CatalogPage />, { initialRoute: '/catalogo' });

    const emptyMessage = await screen.findByText(/No se encontraron condiciones con los filtros aplicados/i);
    expect(emptyMessage).toBeInTheDocument();
  });
});
