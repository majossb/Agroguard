/**
 * Etiqueta técnica en tipografía monoespaciada con mayúsculas y espaciado (tracking).
 */
export function MonoLabel({ children, className = '', as: Component = 'span' }) {
  return (
    <Component
      className={`font-mono text-[11px] font-semibold tracking-wider uppercase text-text-muted ${className}`}
    >
      {children}
    </Component>
  );
}
