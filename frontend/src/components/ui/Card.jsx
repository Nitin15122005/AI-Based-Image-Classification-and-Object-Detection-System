import { classNames } from '../../utils/format.js';

export default function Card({ className, hover = false, padding = 'lg', as: Component = 'div', ...props }) {
  const paddingClasses = {
    none: '',
    sm: 'p-space-sm',
    md: 'p-space-md',
    lg: 'p-space-lg',
    xl: 'p-8',
  };

  return (
    <Component
      className={classNames(
        'rounded-2xl bg-surface-container-lowest shadow-sm',
        hover && 'transition-shadow duration-300 hover:shadow-md',
        paddingClasses[padding],
        className,
      )}
      {...props}
    />
  );
}
