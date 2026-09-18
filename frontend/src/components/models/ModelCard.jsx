import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import { formatConfidence } from '../../utils/format.js';

export default function ModelCard({ info, metrics, metricLabels, icon: Icon, badgeVariant, badgeLabel, progressLabel, progressValue }) {
  const specs = [
    { label: 'Backbone', value: info.backbone },
    { label: 'Input Tensor', value: info.inputSize },
    { label: 'Framework', value: info.framework },
    { label: 'Taxonomy', value: info.taxonomy },
  ];

  return (
    <Card className="flex flex-col justify-between gap-space-md" hover>
      <div className="space-y-space-md">
        <div className="flex items-start justify-between gap-space-sm">
          <div>
            <div className="flex items-center gap-space-xs flex-wrap">
              <Badge variant={badgeVariant}>{badgeLabel}</Badge>
              <span className="font-code-sm text-code-sm text-on-surface-variant">{info.weightsFile}</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-primary mt-1">
              {info.name} ({info.role})
            </h3>
          </div>
          {Icon && (
            <div className="p-2.5 rounded-lg bg-surface-container-low text-primary shrink-0">
              <Icon className="w-7 h-7" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-space-sm">
          {specs.map((spec) => (
            <div key={spec.label} className="bg-surface-container-low p-space-sm rounded-lg">
              <span className="font-label-sm text-label-sm text-on-surface-variant block">{spec.label}</span>
              <span className="font-body-sm text-body-sm font-semibold text-on-surface">{spec.value}</span>
            </div>
          ))}
        </div>

        <div className="pt-space-sm space-y-space-sm">
          <div className="font-label-md text-label-md text-on-surface font-semibold">Validation Metrics</div>
          <div
            className="grid gap-space-xs text-center"
            style={{ gridTemplateColumns: `repeat(${metricLabels.length}, minmax(0, 1fr))` }}
          >
            {metricLabels.map(({ key, label }) => (
              <div key={key} className="p-2 rounded bg-surface-container">
                <div className="font-headline-sm text-headline-sm text-primary">{formatConfidence(metrics[key])}</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">{label}</div>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between font-label-sm text-label-sm">
              <span className="text-on-surface-variant">{progressLabel}</span>
              <span className="text-on-surface font-semibold">{formatConfidence(progressValue)}</span>
            </div>
            <ProgressBar value={progressValue * 100} color={badgeVariant === 'secondary' ? 'secondary' : 'primary'} />
          </div>
        </div>
      </div>

      <div className="pt-space-sm border-t border-surface-container flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
        <span>{info.params}</span>
      </div>
    </Card>
  );
}
