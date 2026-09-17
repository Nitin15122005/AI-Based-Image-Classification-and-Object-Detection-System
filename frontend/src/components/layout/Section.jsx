import { classNames } from '../../utils/format.js';
import { useInView } from '../../hooks/useInView.js';
import PageContainer from './PageContainer.jsx';

/**
 * A full-width page section with a scroll-reveal fade/slide-in animation.
 * `tint` alternates the subtle background band used across the home page.
 */
export default function Section({ tint = false, className, containerClassName, wide, children, ...props }) {
  const [ref, inView] = useInView();

  return (
    <section
      ref={ref}
      className={classNames(
        'w-full py-16 md:py-24',
        tint && 'bg-surface-container-low',
        className,
      )}
      {...props}
    >
      <PageContainer
        wide={wide}
        className={classNames(
          'transition-all duration-700 ease-out',
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
          containerClassName,
        )}
      >
        {children}
      </PageContainer>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, description, action, className }) {
  return (
    <div className={classNames('flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-12', className)}>
      <div className="max-w-2xl">
        {eyebrow && (
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold">
            {eyebrow}
          </span>
        )}
        <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight mt-1">{title}</h2>
        {description && (
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
