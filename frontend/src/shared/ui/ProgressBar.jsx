/**
 * Barra de progreso accesible con soporte para diferentes estados visuales.
 */
export function ProgressBar({
  value = 0, // Entre 0 y 1 o entre 0 y 100
  max = 1,
  status = null,
  variant = 'accent',
  className = '',
  showLabel = false,
  label = null,
}) {
  const normalizedValue = max === 1 ? Math.min(1, Math.max(0, value)) : Math.min(100, Math.max(0, value)) / 100;
  const percentage = Math.round(normalizedValue * 100);

  let barColor = 'bg-accent';

  if (status === 'HEALTHY') barColor = 'bg-accent';
  else if (status === 'DISEASED') barColor = 'bg-granate';
  else if (status === 'INCONCLUSIVE') barColor = 'bg-amber';
  else if (variant === 'forest') barColor = 'bg-forest';
  else if (variant === 'granate') barColor = 'bg-granate';
  else if (variant === 'amber') barColor = 'bg-amber';

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-mono font-medium text-text-muted">
          <span>{label || 'Confianza'}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className="w-full h-2.5 bg-border/60 rounded-full overflow-hidden"
      >
        <div
          className={`h-full ${barColor} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
