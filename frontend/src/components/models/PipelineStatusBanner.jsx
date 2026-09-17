import { Rocket } from 'lucide-react';

const STATUS_ITEMS = [
  { label: 'Backend Service', value: 'FastAPI (not yet connected)' },
  { label: 'Detection Node', value: 'YOLO11s (80 classes) — mock' },
  { label: 'Classification Node', value: 'ResNet50 — mock' },
  { label: 'Acceleration Platform', value: 'CPU (mock) · GPU-ready' },
];

export default function PipelineStatusBanner() {
  return (
    <div className="rounded-xl bg-primary-container text-on-primary p-space-lg shadow-md relative overflow-hidden">
      <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-space-xs text-on-primary-container font-label-sm text-label-sm uppercase tracking-wider">
            <Rocket className="w-4 h-4" />
            Pipeline Status
          </div>
          <div className="font-headline-sm text-headline-sm font-semibold tracking-tight text-on-primary">
            Dual-Stream Inference Architecture
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {STATUS_ITEMS.map((item) => (
            <div key={item.label} className="bg-primary/40 rounded-lg p-space-sm backdrop-blur-sm space-y-1">
              <span className="font-label-sm text-label-sm text-on-primary-container block">{item.label}</span>
              <div className="font-label-md text-label-md text-on-primary flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-secondary-fixed" />
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
