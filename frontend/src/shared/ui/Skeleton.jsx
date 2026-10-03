/**
 * Placeholder animado para estados de carga tipo Skeleton.
 */
export function Skeleton({ className = '', variant = 'rectangular' }) {
  const variantStyles = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4 w-full',
  };

  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-border/50 ${variantStyles[variant] || variantStyles.rectangular} ${className}`}
    />
  );
}
