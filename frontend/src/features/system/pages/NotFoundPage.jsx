import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { ROUTES } from '../../../shared/config/routes.js';
import { Button } from '../../../shared/ui/Button.jsx';
import { Card } from '../../../shared/ui/Card.jsx';
import { MonoLabel } from '../../../shared/ui/MonoLabel.jsx';

export function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto text-center py-12 space-y-6">
      <Card withCorners className="p-8 space-y-4">
        <MonoLabel className="text-granate font-bold">Error 404</MonoLabel>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest">
          Página no encontrada
        </h1>
        <p className="text-sm text-text-muted leading-relaxed">
          La página que buscas no existe o ha sido movida. Verifica la dirección o regresa al inicio.
        </p>
        <div className="pt-2 flex justify-center">
          <Link to={ROUTES.HOME}>
            <Button icon={Home}>Volver al Inicio</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
