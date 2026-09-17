import { classNames } from '../../utils/format.js';

const VARIANT_CLASSES = {
  neutral: 'bg-surface-container-high text-on-surface-variant',
  primary: 'bg-primary-fixed text-on-primary-fixed',
  secondary: 'bg-secondary-fixed text-on-secondary-fixed',
  success: 'bg-emerald-100 text-emerald-900',
  warning: 'bg-amber-100 text-amber-900',
  danger: 'bg-error-container text-on-error-container',
  solid: 'bg-primary text-on-primary',
};

export default function Badge({ variant = 'neutral', className, dot = false, children, ...props }) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-medium',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}
