/**
 * Marco decorativo con marcas de esquina en ángulo recto inspiradas en las maquetas de AgroGuard.
 */
export function CornerFrame({ children, className = '', cornerSize = '14px', cornerColor = '#1E3B2C' }) {
  const lineStyle = {
    borderColor: cornerColor,
    width: cornerSize,
    height: cornerSize,
  };

  return (
    <div className={`relative ${className}`}>
      {/* Esquina superior izquierda */}
      <div
        className="absolute top-0 left-0 border-t-2 border-l-2 pointer-events-none"
        style={lineStyle}
        aria-hidden="true"
      />
      {/* Esquina superior derecha */}
      <div
        className="absolute top-0 right-0 border-t-2 border-r-2 pointer-events-none"
        style={lineStyle}
        aria-hidden="true"
      />
      {/* Esquina inferior izquierda */}
      <div
        className="absolute bottom-0 left-0 border-b-2 border-l-2 pointer-events-none"
        style={lineStyle}
        aria-hidden="true"
      />
      {/* Esquina inferior derecha */}
      <div
        className="absolute bottom-0 right-0 border-b-2 border-r-2 pointer-events-none"
        style={lineStyle}
        aria-hidden="true"
      />

      {children}
    </div>
  );
}
