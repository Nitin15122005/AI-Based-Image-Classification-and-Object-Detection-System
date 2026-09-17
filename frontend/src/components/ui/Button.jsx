import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { classNames } from '../../utils/format.js';

const VARIANT_CLASSES = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-container shadow-[0_2px_8px_-2px_rgba(30,41,59,0.15)] active:scale-[0.98]',
  secondary:
    'bg-surface-container-lowest text-primary hover:bg-surface-container-low shadow-sm active:scale-[0.98]',
  ghost:
    'bg-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
  danger:
    'bg-surface-container-low text-on-surface-variant hover:bg-error-container hover:text-error',
  subtle: 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest',
};

const SIZE_CLASSES = {
  sm: 'px-space-sm py-1.5 text-label-sm font-label-sm rounded-lg gap-1.5',
  md: 'px-space-md py-space-xs text-label-lg font-label-lg rounded-lg gap-2',
  lg: 'px-6 py-3.5 text-label-lg font-label-lg rounded-xl gap-2',
};

const Button = forwardRef(function Button(
  { as, to, href, variant = 'primary', size = 'md', className, children, disabled, ...props },
  ref,
) {
  const classes = classNames(
    'inline-flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }

  const Component = as || 'button';
  return (
    <Component ref={ref} className={classes} disabled={disabled} {...props}>
      {children}
    </Component>
  );
});

export default Button;
