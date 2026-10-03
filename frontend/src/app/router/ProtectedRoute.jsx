import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider.jsx';
import { Spinner } from '../../shared/ui/Spinner.jsx';
import { ROUTES } from '../../shared/config/routes.js';

/**
 * Componente de ruta protegida. Redirige a /ingresar si no hay sesión activa.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" className="text-accent" label="Verificando sesión..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        state={{ returnTo: location.pathname + location.search }}
        replace
      />
    );
  }

  return children;
}
