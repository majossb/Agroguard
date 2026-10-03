import { CheckCircle2, AlertCircle, HelpCircle, ShieldCheck, Tag } from 'lucide-react';
import { COPY } from '../config/copy.es.js';

/**
 * Badge para estados de diagnóstico fitopatológico o etiquetas de clasificación.
 */
export function Badge({
  status,
  label,
  variant = 'default',
  size = 'md',
  className = '',
  icon: CustomIcon,
}) {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  // Si se pasa un status fitopatológico conocido
  if (status) {
    if (status === 'HEALTHY') {
      return (
        <span
          className={`inline-flex items-center font-mono font-semibold uppercase tracking-wider rounded-md bg-accent text-white shadow-sm ${sizeStyles[size]} ${className}`}
        >
          {CustomIcon ? <CustomIcon className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
          <span>{label || COPY.health.healthy}</span>
        </span>
      );
    }

    if (status === 'DISEASED') {
      return (
        <span
          className={`inline-flex items-center font-mono font-semibold uppercase tracking-wider rounded-md bg-granate text-white shadow-sm ${sizeStyles[size]} ${className}`}
        >
          {CustomIcon ? <CustomIcon className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
          <span>{label || COPY.health.diseased}</span>
        </span>
      );
    }

    if (status === 'INCONCLUSIVE') {
      return (
        <span
          className={`inline-flex items-center font-mono font-semibold uppercase tracking-wider rounded-md bg-amber text-white shadow-sm ${sizeStyles[size]} ${className}`}
        >
          {CustomIcon ? <CustomIcon className="w-3.5 h-3.5 shrink-0" /> : <HelpCircle className="w-3.5 h-3.5 shrink-0" />}
          <span>{label || COPY.health.inconclusive}</span>
        </span>
      );
    }
  }

  // Variantes generales
  const variantStyles = {
    default: 'bg-surface text-forest border border-border',
    forest: 'bg-forest text-surface',
    accent: 'bg-accent/15 text-accent border border-accent/30',
    granate: 'bg-granate/15 text-granate border border-granate/30',
    amber: 'bg-amber/15 text-amber-dark border border-amber/30',
    neutral: 'bg-cream text-text-muted border border-border',
  };

  return (
    <span
      className={`inline-flex items-center font-mono text-xs font-semibold tracking-wider uppercase rounded-md ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size]} ${className}`}
    >
      {CustomIcon ? (
        <CustomIcon className="w-3.5 h-3.5 shrink-0" />
      ) : variant === 'forest' ? (
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <Tag className="w-3 h-3 shrink-0" />
      )}
      <span>{label}</span>
    </span>
  );
}
