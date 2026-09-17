import { ListOrdered } from 'lucide-react';
import Card from '../ui/Card.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import { formatConfidence } from '../../utils/format.js';

const RANK_COLORS = ['secondary', 'muted', 'muted', 'muted', 'muted'];

export default function TopPredictionsCard({ predictions }) {
  if (!predictions?.length) return null;

  return (
    <Card className="flex flex-col gap-space-md">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">Top Predictions</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">ResNet50 Top-5 Classification</p>
        </div>
        <ListOrdered className="w-5 h-5 text-on-surface-variant" />
      </div>
      <div className="space-y-space-sm">
        {predictions.map((pred, i) => (
          <div key={pred.class} className="space-y-1">
            <div className="flex justify-between items-center text-body-sm font-body-sm">
              <span className={i === 0 ? 'font-medium text-primary flex items-center gap-1.5' : 'font-normal text-on-surface-variant'}>
                {i === 0 && <span className="w-1.5 h-1.5 rounded-full bg-secondary" />}
                {pred.class}
              </span>
              <span
                className={
                  i === 0
                    ? 'font-code-sm text-code-sm font-semibold text-secondary'
                    : 'font-code-sm text-code-sm text-on-surface-variant'
                }
              >
                {formatConfidence(pred.confidence)}
              </span>
            </div>
            <ProgressBar value={pred.confidence * 100} color={RANK_COLORS[i] || 'muted'} height={i === 0 ? 'h-2' : 'h-1.5'} />
          </div>
        ))}
      </div>
    </Card>
  );
}
