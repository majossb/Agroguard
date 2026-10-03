import { CornerFrame } from './CornerFrame.jsx';

/**
 * Componente Card con superficie clara, borde fino y esquinas redondeadas.
 */
export function Card({
  children,
  className = '',
  withCorners = false,
  cornerColor = '#1E3B2C',
  as: Component = 'div',
  ...props
}) {
  const cardContent = (
    <Component
      className={`bg-surface-card border border-border rounded-xl p-5 md:p-6 shadow-card transition-shadow ${className}`}
      {...props}
    >
      {children}
    </Component>
  );

  if (withCorners) {
    return <CornerFrame cornerColor={cornerColor}>{cardContent}</CornerFrame>;
  }

  return cardContent;
}
