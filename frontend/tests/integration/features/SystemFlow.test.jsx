import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../utils/testUtils.jsx';
import { NotFoundPage } from '../../../src/features/system/pages/NotFoundPage.jsx';

describe('Feature System — NotFoundPage (Manejo de rutas no encontradas 404)', () => {
  it('Muestra el mensaje 404 y enlace para volver al inicio', () => {
    renderWithProviders(<NotFoundPage />, { initialRoute: '/ruta-inexistente' });

    expect(screen.getByText(/Error 404/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Página no encontrada/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Volver al Inicio/i })).toBeInTheDocument();
  });
});
