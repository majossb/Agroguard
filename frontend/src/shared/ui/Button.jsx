import { forwardRef } from 'react';
import { Spinner } from './Spinner.jsx';

/**
 * Componente de Botón accesible con variantes alineadas a la identidad de AgroGuard.
 */
export const Button = forwardRef(function Button(
  {
    children,
    type = 'button',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    className = '',
    icon: Icon,
    iconPosition = 'left',
    ...props
  },
  ref
) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]';

  const variantStyles = {
    primary:
      'bg-forest text-surface hover:bg-forest-dark border border-forest active:bg-forest-dark shadow-sm',
    secondary:
      'bg-surface-card text-forest hover:bg-cream border border-border active:bg-cream-dark shadow-sm',
    accent:
      'bg-accent text-surface hover:bg-accent-dark border border-accent shadow-sm',
    outline:
      'bg-transparent text-forest hover:bg-forest/5 border border-border active:bg-forest/10',
    ghost:
      'bg-transparent text-forest hover:bg-forest/5 active:bg-forest/10',
    danger:
      'bg-granate text-surface hover:bg-granate-dark border border-granate shadow-sm',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px] gap-1.5',
    md: 'text-sm px-4 py-2.5 min-h-[44px] gap-2', // Min 44px para mobile
    lg: 'text-base px-6 py-3.5 min-h-[48px] gap-2.5',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {isLoading && <Spinner size="sm" className="mr-1 text-current" />}
      {!isLoading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
      {!isLoading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
});
