import { ArrowRight } from 'lucide-react';
import { SectionHeading } from '../layout/Section.jsx';
import Card from '../ui/Card.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import Button from '../ui/Button.jsx';
import { DETECTION_METRICS, CLASSIFICATION_METRICS } from '../../data/mockData.js';
import { formatConfidence } from '../../utils/format.js';

export default function MetricsPreviewSection() {
  return (
    <>
      <SectionHeading
        eyebrow="Validation Benchmarks"
        title="Rigorous, transparent metrics."
        action={
          <Button to="/models" variant="ghost" className="!px-0 text-secondary hover:!bg-transparent hover:underline">
            View Full Evaluation
            <ArrowRight className="w-[18px] h-[18px]" />
          </Button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
        <Card padding="xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline-sm text-headline-sm text-primary">YOLO11s Detection</h3>
            <span className="font-code-sm text-code-sm text-on-surface-variant">COCO 2017 val</span>
          </div>
          <div className="space-y-4">
            <MetricRow label="mAP @ 0.50 IoU" value={DETECTION_METRICS.map50} color="primary" />
            <MetricRow label="mAP @ [0.50:0.95] IoU" value={DETECTION_METRICS.map5095} color="secondary" />
            <MetricRow label="Precision" value={DETECTION_METRICS.precision} color="emerald" />
          </div>
        </Card>
        <Card padding="xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline-sm text-headline-sm text-primary">ResNet50 Classification</h3>
            <span className="font-code-sm text-code-sm text-on-surface-variant">COCO crop val</span>
          </div>
          <div className="space-y-4">
            <MetricRow label="Top-1 Accuracy" value={CLASSIFICATION_METRICS.top1} color="primary" />
            <MetricRow label="Top-5 Accuracy" value={CLASSIFICATION_METRICS.top5} color="secondary" />
            <MetricRow label="Macro F1 Score" value={CLASSIFICATION_METRICS.macroF1} color="purple" />
          </div>
        </Card>
      </div>
    </>
  );
}

function MetricRow({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between font-body-sm text-body-sm mb-1.5">
        <span className="text-on-surface-variant">{label}</span>
        <span className="font-semibold text-primary">{formatConfidence(value)}</span>
      </div>
      <ProgressBar value={value * 100} color={color} />
    </div>
  );
}
