import { classNames } from '../../utils/format.js';

const TONE_CLASSES = {
  online: 'bg-secondary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  offline: 'bg-error',
  neutral: 'bg-outline',
};

export default function StatusIndicator({ tone = 'online', label, pulse = true, className }) {
  return (
    <span className={classNames('inline-flex items-center gap-2', className)}>
      <span className="relative flex w-2 h-2">
        {pulse && (
          <span
            className={classNames(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-60',
              TONE_CLASSES[tone],
            )}
          />
        )}
        <span className={classNames('relative inline-flex rounded-full w-2 h-2', TONE_CLASSES[tone])} />
      </span>
      {label && <span className="font-code-sm text-code-sm text-on-surface-variant">{label}</span>}
    </span>
  );
}
