import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../utils/testUtils.jsx';
import { SystemChip } from '../../../src/features/system/components/SystemChip.jsx';
import { server } from '../../mocks/server.js';
import { http, HttpResponse } from 'msw';

describe('Features/System — SystemChip', () => {
  it('Muestra el modelo y versión real recibidos de GET /model/info cuando el servicio está online', async () => {
    renderWithProviders(<SystemChip />);

    await waitFor(() => {
      expect(screen.getByText(/Modelo AgroGuard_MockModel v1\.0\.0/i)).toBeInTheDocument();
    });
  });

  it('Muestra "Servicio no disponible" si el health check responde DOWN', async () => {
    server.use(
      http.get('/api/v1/health', () => {
        return HttpResponse.json({ status: 'DOWN', service: 'agroguard-backend' }, { status: 503 });
      })
    );

    renderWithProviders(<SystemChip />);

    await waitFor(() => {
      expect(screen.getByText(/Servicio no disponible/i)).toBeInTheDocument();
    });
  });
});
