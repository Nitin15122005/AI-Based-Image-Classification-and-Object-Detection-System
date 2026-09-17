import { classNames } from '../../utils/format.js';

export default function Skeleton({ className }) {
  return (
    <div
      className={classNames('animate-pulse rounded-lg bg-surface-container-high', className)}
      aria-hidden="true"
    />
  );
}
