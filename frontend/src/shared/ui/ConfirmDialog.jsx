import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button.jsx';

/**
 * Diálogo modal accesible para confirmaciones de acciones destructivas o críticas.
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {() => void} props.onConfirm
 * @param {string} props.title
 * @param {string} props.description
 * @param {string} [props.confirmLabel='Eliminar']
 * @param {string} [props.cancelLabel='Cancelar']
 * @param {boolean} [props.isLoading=false]
 * @param {'danger' | 'primary'} [props.variant='danger']
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  isLoading = false,
  variant = 'danger',
}) {
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Foco inicial al botón de cancelar para evitar pulsaciones accidentales
    cancelBtnRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/40 backdrop-blur-sm animate-in fade-in duration-150"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div className="relative w-full max-w-md bg-surface-card rounded-2xl border border-border shadow-modal p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 text-text-muted hover:text-text-main rounded-lg"
          aria-label="Cerrar diálogo"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              variant === 'danger' ? 'bg-granate-light text-granate' : 'bg-cream text-forest'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <h2 id="confirm-dialog-title" className="font-serif text-lg font-bold text-forest">
              {title}
            </h2>
            <p id="confirm-dialog-desc" className="text-xs text-text-muted leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
          <Button
            ref={cancelBtnRef}
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={variant}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
