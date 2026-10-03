import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../src/app/providers/AuthProvider.jsx';
import { ToastProvider } from '../../src/app/providers/ToastProvider.jsx';

/**
 * Wrapper para renderizar componentes con QueryClient, AuthProvider, ToastProvider y Router en pruebas.
 * @param {React.ReactNode} ui
 * @param {{ initialRoute?: string }} [options]
 */
export function renderWithProviders(ui, { initialRoute = '/' } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export { render, screen, waitFor };
