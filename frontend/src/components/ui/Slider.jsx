export default function Slider({
  id,
  label,
  value,
  min = 0,
  max = 1,
  step = 0.05,
  onChange,
  formatValue = (v) => v,
  description,
}) {
  return (
    <div className="space-y-space-sm">
      <div className="flex items-center justify-between">
        {label && (
          <label
            htmlFor={id}
            className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <span className="font-code-sm text-code-sm px-2 py-0.5 rounded bg-primary text-on-primary font-bold tabular-nums">
          {formatValue(value)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange?.(Number(e.target.value))}
        className="w-full accent-secondary h-1.5 bg-surface-container rounded-lg cursor-pointer"
        aria-valuetext={formatValue(value)}
      />
      {description && (
        <p className="font-body-sm text-body-sm text-on-surface-variant">{description}</p>
      )}
    </div>
  );
}
