export default function Toggle({ checked, onChange, label, description, id, disabled = false }) {
  return (
    <label
      htmlFor={id}
      className="flex items-center justify-between gap-space-md cursor-pointer select-none"
    >
      {(label || description) && (
        <span className="flex flex-col gap-0.5 min-w-0">
          {label && <span className="font-label-lg text-label-lg text-primary">{label}</span>}
          {description && (
            <span className="font-body-sm text-body-sm text-on-surface-variant">{description}</span>
          )}
        </span>
      )}
      <span className="relative inline-flex items-center shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className="sr-only peer"
        />
        <span
          className="w-11 h-6 rounded-full bg-surface-container-highest peer-checked:bg-secondary transition-colors duration-200 peer-disabled:opacity-50"
        />
        <span
          className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-5 pointer-events-none"
        />
      </span>
    </label>
  );
}
