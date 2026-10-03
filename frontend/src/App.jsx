import { QueryProvider } from './app/providers/QueryProvider.jsx';
import { AuthProvider } from './app/providers/AuthProvider.jsx';
import { ToastProvider } from './app/providers/ToastProvider.jsx';
import { AppRouter } from './app/router/AppRouter.jsx';

/**
 * Componente raíz de la aplicación AgroGuard.
 * Ordena los providers de fuera a dentro: QueryProvider > AuthProvider > ToastProvider > Router.
 */
export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
