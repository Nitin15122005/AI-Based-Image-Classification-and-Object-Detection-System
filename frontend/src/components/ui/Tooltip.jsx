import { useId, useState } from 'react';
import { classNames } from '../../utils/format.js';

export default function Tooltip({ label, children, className }) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <span
      className={classNames('relative inline-flex', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {typeof children === 'function' ? children({ 'aria-describedby': id }) : children}
      <span
        role="tooltip"
        id={id}
        className={classNames(
          'pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-primary px-2.5 py-1.5 font-label-sm text-label-sm text-on-primary shadow-lg transition-opacity duration-150 z-50',
          visible ? 'opacity-100' : 'opacity-0',
        )}
      >
        {label}
      </span>
    </span>
  );
}
