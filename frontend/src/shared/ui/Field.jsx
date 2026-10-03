import { forwardRef } from 'react';

/**
 * Campo de formulario accesible con etiqueta, descripción, validación y soporte numérico.
 */
export const Field = forwardRef(function Field(
  {
    id,
    label,
    error,
    helperText,
    required = false,
    className = '',
    as = 'input',
    numericOnly = false,
    children,
    onKeyDown,
    onChange,
    ...props
  },
  ref
) {
  const Component = as;
  const inputId = id || props.name;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  const baseInputStyles =
    'w-full bg-surface border rounded-lg px-3.5 py-2.5 text-sm text-text-main placeholder:text-text-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:bg-cream-dark disabled:cursor-not-allowed shadow-sm';

  const errorStyles = error
    ? 'border-granate text-granate-dark focus:ring-granate/30 focus:border-granate bg-granate-light/10'
    : 'border-border';

  const handleKeyDown = (e) => {
    if (numericOnly) {
      const allowedKeys = [
        'Backspace',
        'Delete',
        'Tab',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Enter',
        'Home',
        'End',
      ];
      const isCtrlCmd = e.ctrlKey || e.metaKey;
      if (!/^\d$/.test(e.key) && !allowedKeys.includes(e.key) && !isCtrlCmd) {
        e.preventDefault();
      }
    }
    onKeyDown?.(e);
  };

  const handleChange = (e) => {
    if (numericOnly && typeof e.target.value === 'string') {
      e.target.value = e.target.value.replace(/\D/g, '');
    }
    onChange?.(e);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider text-text-main flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-granate ml-1" aria-hidden="true">*</span>}
          </span>
          {required && (
            <span className="font-mono text-[10px] text-text-muted lowercase">
              requerido
            </span>
          )}
        </label>
      )}

      <Component
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
        inputMode={numericOnly ? 'numeric' : props.inputMode}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        className={`${baseInputStyles} ${errorStyles}`}
        {...props}
      >
        {children}
      </Component>

      {helperText && !error && (
        <p id={helperId} className="text-xs text-text-muted">
          {helperText}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs font-semibold text-granate flex items-center gap-1 mt-0.5">
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});
