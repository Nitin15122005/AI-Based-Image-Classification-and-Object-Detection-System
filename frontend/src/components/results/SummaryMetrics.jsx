import { Boxes, Gauge, Timer, Sparkles } from 'lucide-react';
import MetricCard from '../ui/MetricCard.jsx';
import { formatConfidence, formatMs } from '../../utils/format.js';

export default function SummaryMetrics({ analysis }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
      <MetricCard
        label="Objects Detected"
        numericValue={analysis.detections.length}
        icon={Boxes}
        helpText={`${analysis.distinctClasses} distinct classes`}
      />
      <MetricCard
        label="Average Confidence"
        value={formatConfidence(analysis.avgDetectionConfidence)}
        icon={Gauge}
        helpText="Mean detection confidence"
      />
      <MetricCard
        label="Processing Time"
        value={formatMs(analysis.processingTimeMs)}
        icon={Timer}
        helpText="End-to-end, upload to result"
      />
      <MetricCard
        label="Models Used"
        value="YOLO11s + ResNet50"
        valueClassName="font-headline-sm text-headline-sm"
        icon={Sparkles}
        helpText={`Scene: ${analysis.sceneClassification}`}
      />
    </div>
  );
}
