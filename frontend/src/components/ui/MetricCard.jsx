import Card from './Card.jsx';
import { classNames } from '../../utils/format.js';
import { useCountUp } from '../../hooks/useCountUp.js';

/**
 * A single stat tile. Pass either `value` (string, rendered as-is) or
 * `numericValue` + `decimals` to get an animated count-up on mount.
 */
export default function MetricCard({
  label,
  value,
  numericValue,
  decimals = 0,
  suffix = '',
  icon: Icon,
  helpText,
  badge,
  className,
  valueClassName,
}) {
  const animated = useCountUp(numericValue, { decimals });
  const displayValue = numericValue != null ? `${animated}${suffix}` : value;

  return (
    <Card padding="lg" className={classNames('flex flex-col justify-between gap-space-md', className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
          {label}
        </span>
        {Icon && <Icon className="w-5 h-5 text-secondary shrink-0" strokeWidth={2} />}
        {badge}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={classNames(
            'text-primary font-bold tracking-tight tabular-nums truncate',
            valueClassName || 'font-headline-xl text-headline-xl',
          )}
        >
          {displayValue}
        </span>
      </div>
      {helpText && (
        <span className="font-body-sm text-body-sm text-on-surface-variant">{helpText}</span>
      )}
    </Card>
  );
}
