import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import { formatConfidence, titleCase } from '../../utils/format.js';

function buildSummary(analysis) {
  const { detections, distinctClasses, sceneClassification } = analysis;
  if (!detections.length) {
    return `No objects were detected above the current confidence threshold. Try lowering the threshold on the Analyze page or uploading a clearer image.`;
  }
  const top = [...detections].sort((a, b) => b.detectionConfidence - a.detectionConfidence)[0];
  return `${detections.length} object${detections.length === 1 ? '' : 's'} ${
    detections.length === 1 ? 'was' : 'were'
  } detected across ${distinctClasses} distinct class${distinctClasses === 1 ? '' : 'es'}. The highest-confidence detection was ${titleCase(
    top.label,
  )} at ${formatConfidence(top.detectionConfidence)}. The overall scene is classified as ${sceneClassification}.`;
}

export default function AiSummaryCard({ analysis }) {
  const confidenceTier = analysis.avgDetectionConfidence >= 0.85 ? 'High' : analysis.avgDetectionConfidence >= 0.6 ? 'Medium' : 'Low';

  return (
    <Card className="flex flex-col gap-space-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
          <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">AI Summary</h3>
        </div>
        <Badge variant="secondary">Confidence: {confidenceTier}</Badge>
      </div>
      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
        {buildSummary(analysis)}
      </p>
      <div className="pt-space-xs flex items-center gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
        <span>YOLO11s</span>
        <span>&middot;</span>
        <span>ResNet50</span>
      </div>
    </Card>
  );
}
