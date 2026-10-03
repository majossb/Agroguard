import { useSystemStatus } from '../hooks/useSystemStatus.js';

/**
 * Chip indicador de estado del modelo o servicio en el encabezado.
 * Muestra el estado real (de /health y /model/info) sin inventar capacidades offline.
 */
export function SystemChip({ className = '' }) {
  const { isOnline, modelInfo, isLoading } = useSystemStatus();

  if (isLoading) {
    return (
      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cream border border-border text-[11px] font-mono text-text-muted ${className}`}>
        <span className="w-2 h-2 rounded-full bg-text-muted/40 animate-pulse" />
        <span>Verificando modelo...</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-granate/10 border border-granate/30 text-[11px] font-mono text-granate ${className}`}>
        <span className="w-2 h-2 rounded-full bg-granate" />
        <span>Servicio no disponible</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-[11px] font-mono text-forest tracking-wider uppercase ${className}`}>
      <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
      <span className="font-semibold">
        Modelo {modelInfo.name} v{modelInfo.version}
      </span>
    </div>
  );
}
