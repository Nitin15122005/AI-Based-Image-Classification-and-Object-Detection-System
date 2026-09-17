import { classNames } from '../../utils/format.js';

export default function PageContainer({ className, children, wide = false }) {
  return (
    <div
      className={classNames(
        'w-full mx-auto px-margin-mobile md:px-margin',
        wide ? 'max-w-[1600px]' : 'max-w-7xl',
        className,
      )}
    >
      {children}
    </div>
  );
}
