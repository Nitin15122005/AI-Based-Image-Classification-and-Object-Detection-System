import { SectionHeading } from '../layout/Section.jsx';
import { FEATURED_CLASSES, COCO_CLASSES } from '../../data/cocoClasses.js';

export default function SupportedClassesSection() {
  const remaining = COCO_CLASSES.length - FEATURED_CLASSES.length;

  return (
    <>
      <SectionHeading
        eyebrow="Vocabulary Range"
        title="Detect objects across 80 categories"
        action={
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-highest text-on-surface-variant font-code-sm text-code-sm">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            80 COCO classes supported
          </div>
        }
      />
      <div className="flex flex-wrap gap-2.5">
        {FEATURED_CLASSES.map((cls) => (
          <span
            key={cls}
            className="px-4 py-2 rounded-xl bg-surface-container-lowest text-primary font-label-md text-label-md shadow-sm hover:bg-primary hover:text-on-primary transition-all cursor-default"
          >
            {cls}
          </span>
        ))}
        <span className="px-4 py-2 rounded-xl bg-surface-container-high text-on-surface-variant font-label-md text-label-md shadow-sm">
          + {remaining} more
        </span>
      </div>
    </>
  );
}
