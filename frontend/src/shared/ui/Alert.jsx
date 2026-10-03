import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

/**
 * Componente Alert accesible con icono semántico y opciones de cierre.
 */
export function Alert({
  children,
  type = 'info',
  title,
  onClose,
  className = '',
}) {
  const configs = {
    info: {
      bg: 'bg-cream-light border-border text-text-main',
      icon: Info,
      iconColor: 'text-forest',
    },
    success: {
      bg: 'bg-accent-light border-accent/30 text-forest',
      icon: CheckCircle2,
      iconColor: 'text-accent',
    },
    warning: {
      bg: 'bg-amber-light border-amber/30 text-forest',
      icon: AlertTriangle,
      iconColor: 'text-amber-dark',
    },
    error: {
      bg: 'bg-granate-light border-granate/30 text-granate-dark',
      icon: AlertCircle,
      iconColor: 'text-granate',
    },
  };

  const current = configs[type] || configs.info;
  const Icon = current.icon;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border ${current.bg} ${className}`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${current.iconColor}`} aria-hidden="true" />
      <div className="flex-1 text-sm">
        {title && <h4 className="font-semibold mb-1 font-sans text-sm">{title}</h4>}
        <div className="leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar aviso"
          className="p-1 -mr-1 -mt-1 rounded-lg text-text-muted hover:text-text-main hover:bg-black/5"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
