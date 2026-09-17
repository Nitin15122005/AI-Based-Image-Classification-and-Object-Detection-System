import { ScanEye, BarChart3, History as HistoryIcon } from 'lucide-react';
import Card from '../ui/Card.jsx';

const FEATURES = [
  {
    icon: ScanEye,
    title: 'Spatial Localization',
    body: 'COCO-trained boxes detect people, vehicles, and everyday objects with tight boundaries.',
  },
  {
    icon: BarChart3,
    title: 'Top-5 Classification',
    body: 'ResNet50 ranks class likelihoods and confidence scores for every detected object.',
  },
  {
    icon: HistoryIcon,
    title: 'Saved Analysis History',
    body: 'Every run is saved so you can revisit results, compare confidence, and re-run later.',
  },
];

export default function FeatureHighlights() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg pt-space-md">
      {FEATURES.map((f) => (
        <Card key={f.title} className="flex items-start gap-space-md">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0">
            <f.icon className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div className="space-y-1">
            <h4 className="font-headline-sm text-headline-sm text-primary">{f.title}</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{f.body}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
