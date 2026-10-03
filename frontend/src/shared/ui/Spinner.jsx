/**
 * Componente Spinner de carga accesible.
 */
export function Spinner({ size = 'md', className = '', label = 'Cargando...' }) {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div
      role="status"
      aria-label={label}
      className={`inline-block animate-spin rounded-full border-solid border-current border-t-transparent ${sizeMap[size] || sizeMap.md} ${className}`}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}
