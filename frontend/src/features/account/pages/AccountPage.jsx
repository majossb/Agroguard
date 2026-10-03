import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LogOut, Trash2, User, ShieldAlert, CalendarDays } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { useToast } from '../../../app/providers/ToastProvider.jsx';
import { getMe, deleteAccount } from '../api/accountApi.js';
import { mapUserProfile } from '../mappers/accountMapper.js';
import { ROUTES } from '../../../shared/config/routes.js';
import { Button } from '../../../shared/ui/Button.jsx';
import { Card } from '../../../shared/ui/Card.jsx';
import { Skeleton } from '../../../shared/ui/Skeleton.jsx';
import { MonoLabel } from '../../../shared/ui/MonoLabel.jsx';
import { Alert } from '../../../shared/ui/Alert.jsx';
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog.jsx';
import { formatDate } from '../../../shared/lib/formatters.js';

export function AccountPage() {
  const { logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /** Perfil del usuario autenticado — siempre fresco (staleTime = 0) */
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['account', 'me'],
    queryFn: async () => {
      const raw = await getMe();
      return mapUserProfile(raw);
    },
    retry: 1,
  });

  /** Cierre de sesión estándar */
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.info('Sesión cerrada correctamente.', 'Esperamos verte pronto en AgroGuard.');
      navigate(ROUTES.HOME, { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  /** Eliminación de cuenta en cascada */
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount();
      await logout();
      toast.info('Cuenta eliminada', 'Tu cuenta y todos tus datos han sido borrados de forma definitiva.');
      navigate(ROUTES.HOME, { replace: true });
    } catch {
      setDeleteError(
        'No se pudo eliminar la cuenta. Verifica tu conexión e inténtalo de nuevo.'
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 py-2 max-w-2xl mx-auto">
      {/* Encabezado */}
      <div className="border-b border-border pb-4">
        <MonoLabel>Configuración</MonoLabel>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest mt-1">
          Mi Perfil
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Información de tu cuenta de AgroGuard.
        </p>
      </div>

      {/* Datos del perfil */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cream border border-border flex items-center justify-center text-forest">
            <User className="w-5 h-5 text-accent" aria-hidden="true" />
          </div>
          <h2 className="text-base font-serif font-bold text-forest">Información de cuenta</h2>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ) : isError ? (
          <Alert variant="error">
            No se pudo cargar el perfil. Verifica tu conexión al servidor.
          </Alert>
        ) : profile ? (
          <dl className="space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:gap-6">
              <dt className="text-xs font-mono text-text-muted w-28 flex-shrink-0 mt-0.5">
                Nombre
              </dt>
              <dd className="font-medium text-text">{profile.fullName}</dd>
            </div>

            <div className="flex flex-col sm:flex-row sm:gap-6">
              <dt className="text-xs font-mono text-text-muted w-28 flex-shrink-0 mt-0.5">
                Correo
              </dt>
              <dd className="font-medium text-text break-all">{profile.email}</dd>
            </div>

            <div className="flex flex-col sm:flex-row sm:gap-6">
              <dt className="text-xs font-mono text-text-muted w-28 flex-shrink-0 mt-0.5">
                Rol
              </dt>
              <dd className="font-medium text-text">{profile.role}</dd>
            </div>

            <div className="flex flex-col sm:flex-row sm:gap-6 pt-2 border-t border-border">
              <dt className="text-xs font-mono text-text-muted w-28 flex-shrink-0 mt-0.5 flex items-center gap-1">
                <CalendarDays className="w-3 h-3" aria-hidden="true" />
                Miembro desde
              </dt>
              <dd className="text-xs font-mono text-text-muted">
                {formatDate(profile.createdAt)}
              </dd>
            </div>
          </dl>
        ) : null}
      </Card>

      {/* Cerrar sesión */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cream border border-border flex items-center justify-center text-forest">
            <LogOut className="w-5 h-5 text-accent" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-forest">Cerrar sesión</h2>
            <p className="text-xs text-text-muted">
              Cierra tu sesión activa en este dispositivo.
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          icon={LogOut}
          onClick={handleLogout}
          isLoading={isLoggingOut}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </Button>
      </Card>

      {/* Zona de peligro — eliminar cuenta */}
      <Card className="p-6 space-y-4 border-granate/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-granate/10 border border-granate/20 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-granate" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-granate">Zona de peligro</h2>
            <p className="text-xs text-text-muted">
              Acciones irreversibles que afectan permanentemente a tu cuenta.
            </p>
          </div>
        </div>

        <div className="bg-granate/5 border border-granate/20 rounded-xl p-4 space-y-3">
          <p className="text-sm text-text font-medium">Eliminar cuenta</p>
          <p className="text-xs text-text-muted leading-relaxed">
            Se eliminarán permanentemente tu perfil, todos tus diagnósticos, imágenes
            asociadas, retroalimentación y sesiones activas. Esta acción{' '}
            <strong>no se puede deshacer</strong>.
          </p>

          {deleteError && <Alert variant="error">{deleteError}</Alert>}

          <Button
            variant="danger"
            icon={Trash2}
            onClick={() => setDeleteOpen(true)}
            disabled={isDeleting}
          >
            Eliminar mi cuenta
          </Button>
        </div>
      </Card>

      {/* Diálogo de confirmación de borrado */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteError('');
        }}
        onConfirm={handleDeleteAccount}
        isLoading={isDeleting}
        title="¿Eliminar cuenta definitivamente?"
        description="Esta acción borrará tu perfil, todos tus diagnósticos e imágenes de forma permanente. No hay marcha atrás."
        confirmLabel="Sí, eliminar todo"
        variant="danger"
      />
    </div>
  );
}
