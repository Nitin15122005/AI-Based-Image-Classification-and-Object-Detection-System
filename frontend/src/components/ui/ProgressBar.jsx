import { classNames } from '../../utils/format.js';

const COLOR_CLASSES = {
  secondary: 'bg-secondary',
  primary: 'bg-primary',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  purple: 'bg-purple-500',
  muted: 'bg-on-surface-variant/40',
};

export default function ProgressBar({ value, color = 'secondary', height = 'h-2', animated = true, className }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={classNames('w-full rounded-full bg-surface-container overflow-hidden', height, className)}>
      <div
        className={classNames(
          'h-full rounded-full',
          COLOR_CLASSES[color] || COLOR_CLASSES.secondary,
          animated && 'transition-[width] duration-700 ease-out',
        )}
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
