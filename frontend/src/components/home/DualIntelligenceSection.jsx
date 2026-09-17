import { Crop, Network, CheckCircle2 } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import { SectionHeading } from '../layout/Section.jsx';
import { DETECTION_METRICS, CLASSIFICATION_METRICS } from '../../data/mockData.js';
import { formatConfidence } from '../../utils/format.js';

const FEATURES = {
  detection: [
    {
      title: '80 COCO Classes',
      body: 'Localizes people, vehicles, everyday items, and street equipment.',
    },
    {
      title: 'Precise Coordinate Anchors',
      body: 'Bounding-box tensor outputs give tight, pixel-accurate object boundaries.',
    },
    {
      title: 'NMS Overlap Suppression',
      body: 'Non-Maximum Suppression keeps detection output sets clean and non-redundant.',
    },
  ],
  classification: [
    {
      title: 'Top-1 & Top-5 Hypotheses',
      body: 'Multi-tiered softmax probability ranking for every detected object.',
    },
    {
      title: 'Dense Feature Embedding',
      body: 'High-order residual activations capture rich scene and object context.',
    },
    {
      title: 'Calibrated Confidence',
      body: 'Stable softmax distributions avoid overconfident, misleading scores.',
    },
  ],
};

export default function DualIntelligenceSection() {
  return (
    <>
      <SectionHeading
        eyebrow="Architecture Capabilities"
        title="One image. Two layers of intelligence."
        description="A unified pipeline that separates whole-scene classification from precise, per-object spatial detection."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
        <Card padding="xl" hover>
          <div className="flex items-start justify-between mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center">
              <Crop className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <Badge variant="primary">Object Detection</Badge>
          </div>
          <h3 className="font-headline-md text-headline-md text-primary mb-2">YOLO11s Architecture</h3>
          <p className="font-body-md text-body-md text-on-surface-variant mb-6 leading-relaxed">
            Fast convolutional bounding-box predictor trained across the standardized 80-class
            COCO 2017 taxonomy.
          </p>
          <ul className="space-y-3 font-body-sm text-body-sm text-on-surface-variant mb-6">
            {FEATURES.detection.map((f) => (
              <li key={f.title} className="flex items-start gap-2">
                <CheckCircle2 className="w-[18px] h-[18px] text-secondary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">{f.title}</strong> — {f.body}
                </span>
              </li>
            ))}
          </ul>
          <div className="pt-4 flex items-center justify-between border-t border-surface-container text-on-surface-variant font-code-sm text-code-sm">
            <span>
              mAP[0.50:0.95]: <strong className="text-primary">{formatConfidence(DETECTION_METRICS.map5095)}</strong>
            </span>
            <span>
              Precision: <strong className="text-primary">{formatConfidence(DETECTION_METRICS.precision)}</strong>
            </span>
          </div>
        </Card>

        <Card padding="xl" hover>
          <div className="flex items-start justify-between mb-6">
            <div className="w-12 h-12 rounded-xl bg-secondary text-on-secondary flex items-center justify-center">
              <Network className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <Badge variant="secondary">Feature Classification</Badge>
          </div>
          <h3 className="font-headline-md text-headline-md text-primary mb-2">ResNet50 Deep Residuals</h3>
          <p className="font-body-md text-body-md text-on-surface-variant mb-6 leading-relaxed">
            A 50-layer residual network using skip connections to resolve vanishing gradients
            across deep feature representations.
          </p>
          <ul className="space-y-3 font-body-sm text-body-sm text-on-surface-variant mb-6">
            {FEATURES.classification.map((f) => (
              <li key={f.title} className="flex items-start gap-2">
                <CheckCircle2 className="w-[18px] h-[18px] text-secondary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">{f.title}</strong> — {f.body}
                </span>
              </li>
            ))}
          </ul>
          <div className="pt-4 flex items-center justify-between border-t border-surface-container text-on-surface-variant font-code-sm text-code-sm">
            <span>
              Top-1 Accuracy: <strong className="text-primary">{formatConfidence(CLASSIFICATION_METRICS.top1)}</strong>
            </span>
            <span>
              Top-5 Accuracy: <strong className="text-primary">{formatConfidence(CLASSIFICATION_METRICS.top5)}</strong>
            </span>
          </div>
        </Card>
      </div>
    </>
  );
}
