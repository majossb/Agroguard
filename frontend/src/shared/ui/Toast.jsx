import { useEffect, useRef, useState } from 'react';
import { Check, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

/**
 * Notificación nativa de AgroGuard.
 *
 * Ciclo de vida:
 *   mount           → clase  .toast-enter  (fade-in + slide-down 6px, 220ms)
 *   antes de cerrar → clase  .toast-exit   (fade-out + slide-up 4px, 180ms)
 *   tras exit       → llama onClose para que el provider la elimine del DOM
 *
 * @param {object}   props
 * @param {string}   props.id
 * @param {'success'|'error'|'warning'|'info'} props.type
 * @param {string}   props.title
 * @param {string}  [props.message]
 * @param {()=>void} props.onClose
 * @param {number}  [props.duration=3800]  0 = sin auto-dismiss
 */
export function Toast({ id, type = 'info', title, message, onClose, duration = 3800 }) {
  const [phase, setPhase] = useState('entering'); // 'entering' | 'idle' | 'exiting'
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  /** Inicia la animación de salida antes de eliminar del DOM */
  const dismiss = () => {
    if (phase === 'exiting') return;
    setPhase('exiting');
  };

  /** Al terminar cualquier animación CSS, avanzamos de fase */
  const handleAnimationEnd = () => {
    if (phase === 'entering') {
      setPhase('idle');
    } else if (phase === 'exiting') {
      onCloseRef.current?.();
    }
  };

  /** Auto-dismiss basado en duration */
  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const configs = {
    success: {
      iconBg: 'bg-accent/10 border-accent/20 text-accent',
      icon: Check,
      role: 'status',
      ariaLive: 'polite',
    },
    error: {
      iconBg: 'bg-granate/10 border-granate/20 text-granate',
      icon: AlertCircle,
      role: 'alert',
      ariaLive: 'assertive',
    },
    warning: {
      iconBg: 'bg-amber/10 border-amber/20 text-amber-dark',
      icon: AlertTriangle,
      role: 'status',
      ariaLive: 'polite',
    },
    info: {
      iconBg: 'bg-forest/10 border-forest/20 text-forest',
      icon: Info,
      role: 'status',
      ariaLive: 'polite',
    },
  };

  const cfg = configs[type] ?? configs.info;
  const Icon = cfg.icon;

  const animClass =
    phase === 'entering' ? 'toast-enter' : phase === 'exiting' ? 'toast-exit' : '';

  return (
    <div
      id={`toast-${id}`}
      role={cfg.role}
      aria-live={cfg.ariaLive}
      onAnimationEnd={handleAnimationEnd}
      className={`${animClass} relative flex items-start gap-2.5 px-3 py-2.5 bg-surface-card border border-border/70 rounded-xl shadow-card w-full hover:shadow-md transition-shadow duration-200`}
    >
      {/* Icono — círculo pequeño con acento de color */}
      <div
        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-[1px] ${cfg.iconBg}`}
      >
        <Icon className="w-3.5 h-3.5 stroke-[2.25]" aria-hidden="true" />
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0 pr-0.5">
        <p className="text-[13px] font-serif font-semibold text-forest leading-snug tracking-[-0.01em]">
          {title}
        </p>
        {message && (
          <p className="text-[11px] text-text-muted leading-relaxed mt-0.5">
            {message}
          </p>
        )}
      </div>

      {/* Botón cerrar — mínimo, casi invisible hasta hover */}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar notificación"
        className="shrink-0 -mr-1 -mt-0.5 p-1 rounded-md text-text-muted/30 hover:text-forest hover:bg-forest/5 transition-colors duration-150"
      >
        <X className="w-3 h-3" aria-hidden="true" />
      </button>
    </div>
  );
}

