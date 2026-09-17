import { CheckCircle2, Loader2, Clock } from 'lucide-react';
import Card from '../ui/Card.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import { classNames } from '../../utils/format.js';

export const PIPELINE_STAGES = [
  { key: 'preparing', label: 'Preparing image', detail: 'Normalizing & resizing tensor' },
  { key: 'detecting', label: 'Running object detection', detail: 'YOLO11s forward pass' },
  { key: 'classifying', label: 'Classifying objects', detail: 'ResNet50 top-5 inference' },
  { key: 'finalizing', label: 'Preparing results', detail: 'Building response payload' },
];

export default function InferencePipelinePanel({ stage }) {
  const activeIndex = PIPELINE_STAGES.findIndex((s) => s.key === stage);
  const progress = ((activeIndex + 1) / PIPELINE_STAGES.length) * 100;

  return (
    <Card className="flex flex-col gap-space-md" role="status" aria-live="polite">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <Loader2 className="w-5 h-5 text-secondary animate-spin" strokeWidth={2.25} />
          <h3 className="font-headline-sm text-headline-sm text-primary">Inference Pipeline</h3>
        </div>
        <span className="font-code-sm text-code-sm text-secondary font-semibold">
          Step {activeIndex + 1} of {PIPELINE_STAGES.length}
        </span>
      </div>

      <ProgressBar value={progress} color="secondary" />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-space-sm pt-space-xs">
        {PIPELINE_STAGES.map((s, i) => {
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;
          const isPending = i > activeIndex;

          return (
            <div
              key={s.key}
              className={classNames(
                'p-space-sm rounded-xl flex flex-col gap-1 transition-colors',
                isActive && 'bg-secondary-fixed shadow-sm',
                isDone && 'bg-surface-container-low',
                isPending && 'bg-surface-container-low opacity-60',
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={classNames(
                    'font-label-sm text-label-sm',
                    isActive ? 'text-on-secondary-fixed' : 'text-on-surface-variant',
                  )}
                >
                  Step {i + 1}
                </span>
                {isDone && <CheckCircle2 className="w-4 h-4 text-secondary" />}
                {isActive && <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />}
                {isPending && <Clock className="w-4 h-4 text-on-surface-variant" />}
              </div>
              <span
                className={classNames(
                  'font-label-md text-label-md',
                  isActive ? 'text-on-secondary-fixed font-semibold' : 'text-primary',
                )}
              >
                {s.label}
              </span>
              <span className="font-code-sm text-code-sm text-on-surface-variant">
                {isActive ? s.detail : isDone ? 'Complete' : 'Pending'}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
