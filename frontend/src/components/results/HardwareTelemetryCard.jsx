import Card from '../ui/Card.jsx';
import { isRealApiConfigured } from '../../services/api.js';

export default function HardwareTelemetryCard({ analysis }) {
  const items = [
    { label: 'Detection Input Tensor', value: '640 × 640 × 3' },
    { label: 'Classification Input Tensor', value: '224 × 224 × 3' },
    { label: 'Detection Backbone', value: 'CSPDarknet + C3k2' },
    { label: 'Classification Backbone', value: 'ResNet50 (50-layer)' },
    { label: 'Source Resolution', value: `${analysis.width} × ${analysis.height}` },
    {
      label: 'Serving Device',
      value: isRealApiConfigured ? 'GPU-accelerated (see Models & Metrics)' : 'Local mock',
    },
  ];

  return (
    <Card className="flex flex-col gap-space-sm">
      <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
        Pipeline Details
      </h4>
      <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
        {items.map((item) => (
          <div key={item.label} className="p-space-sm rounded-lg bg-surface-container-low">
            <span className="font-label-sm text-label-sm text-on-surface-variant block">{item.label}</span>
            <span className="font-code-sm text-code-sm text-primary font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
