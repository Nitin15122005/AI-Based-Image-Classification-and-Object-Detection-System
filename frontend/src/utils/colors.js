// Tailwind's JIT scanner needs complete literal class strings, so detection
// accent colors are resolved through this lookup table instead of string
// interpolation (e.g. `bg-${color}-500`, which Tailwind cannot detect).
export const DETECTION_COLOR_STYLES = {
  secondary: {
    border: 'border-secondary',
    bg: 'bg-secondary',
    text: 'text-secondary',
    softBg: 'bg-secondary-fixed',
    softText: 'text-on-secondary-fixed',
    dot: 'bg-secondary',
  },
  emerald: {
    border: 'border-emerald-500',
    bg: 'bg-emerald-500',
    text: 'text-emerald-600',
    softBg: 'bg-emerald-100',
    softText: 'text-emerald-900',
    dot: 'bg-emerald-500',
  },
  amber: {
    border: 'border-amber-500',
    bg: 'bg-amber-500',
    text: 'text-amber-600',
    softBg: 'bg-amber-100',
    softText: 'text-amber-900',
    dot: 'bg-amber-500',
  },
  purple: {
    border: 'border-purple-500',
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    softBg: 'bg-purple-100',
    softText: 'text-purple-900',
    dot: 'bg-purple-500',
  },
};

export function getDetectionColor(colorClass) {
  return DETECTION_COLOR_STYLES[colorClass] || DETECTION_COLOR_STYLES.secondary;
}

export function confidenceTier(confidence) {
  if (confidence >= 0.9) return 'high';
  if (confidence >= 0.7) return 'medium';
  return 'low';
}

export const CONFIDENCE_TIER_STYLES = {
  high: 'text-emerald-600',
  medium: 'text-amber-600',
  low: 'text-error',
};
