import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Toast } from '../../shared/ui/Toast.jsx';

const ToastContext = createContext(null);

let toastCount = 0;

/**
 * Proveedor global de notificaciones tipo Toast.
 * Gestiona el ciclo de vida y renderizado armonioso sobre la interfaz de AgroGuard.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = 'info', title, message, duration = 3800 }) => {
      const id = `toast-${Date.now()}-${++toastCount}`;
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);
      return id;
    },
    []
  );

  const toast = useMemo(
    () => ({
      success: (title, message, duration) =>
        addToast({ type: 'success', title, message, duration }),
      error: (title, message, duration) =>
        addToast({ type: 'error', title, message, duration }),
      warning: (title, message, duration) =>
        addToast({ type: 'warning', title, message, duration }),
      info: (title, message, duration) =>
        addToast({ type: 'info', title, message, duration }),
      dismiss: removeToast,
    }),
    [addToast, removeToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Contenedor flotante superior derecho integrado con margen holgado respecto al navbar */}
      <div
        className="fixed top-20 sm:top-24 right-4 sm:right-6 md:right-8 z-50 flex flex-col gap-2.5 w-full max-w-[calc(100vw-2rem)] sm:w-[350px] pointer-events-none"
        aria-label="Notificaciones"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto transition-all duration-200">
            <Toast
              id={t.id}
              type={t.type}
              title={t.title}
              message={t.message}
              duration={t.duration}
              onClose={() => removeToast(t.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Hook para disparar toasts desde cualquier componente de la aplicación.
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe utilizarse dentro de un ToastProvider');
  }
  return context;
}
