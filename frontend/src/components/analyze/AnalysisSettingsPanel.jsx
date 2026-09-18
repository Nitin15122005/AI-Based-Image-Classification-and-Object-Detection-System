import { Settings2, Play } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Toggle from '../ui/Toggle.jsx';
import Slider from '../ui/Slider.jsx';
import StatusIndicator from '../ui/StatusIndicator.jsx';
import { formatPercent } from '../../utils/format.js';
import { isRealApiConfigured } from '../../services/api.js';

export default function AnalysisSettingsPanel({ settings, onChange, onAnalyze, disabled }) {
  return (
    <div className="flex flex-col gap-space-lg">
      <Card className="flex flex-col gap-space-lg">
        <div className="flex items-center gap-space-xs">
          <Settings2 className="w-5 h-5 text-primary" strokeWidth={1.75} />
          <h3 className="font-headline-sm text-headline-sm text-primary">Analysis Settings</h3>
        </div>

        <div className="space-y-space-md">
          <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
            Active Models
          </label>
          <div className="p-space-md rounded-xl bg-surface-container-low">
            <Toggle
              id="toggle-detection"
              checked={settings.detectionEnabled}
              onChange={(checked) => onChange({ ...settings, detectionEnabled: checked })}
              label="YOLO11s Object Detection"
              description="Localize objects with bounding boxes (80 classes)"
            />
          </div>
          <div className="p-space-md rounded-xl bg-surface-container-low">
            <Toggle
              id="toggle-classification"
              checked={settings.classificationEnabled}
              onChange={(checked) => onChange({ ...settings, classificationEnabled: checked })}
              label="ResNet50 Classification"
              description="Classify each detected object and the overall scene"
            />
          </div>
        </div>

        <Slider
          id="conf-threshold"
          label="Confidence Threshold"
          value={settings.confidenceThreshold}
          min={0.1}
          max={0.9}
          step={0.05}
          onChange={(value) => onChange({ ...settings, confidenceThreshold: value })}
          formatValue={(v) => formatPercent(v, 0)}
          description="Detections below this confidence are filtered out to reduce false positives."
        />
      </Card>

      <Card className="flex flex-col gap-space-md">
        <Button
          size="lg"
          className="w-full"
          onClick={onAnalyze}
          disabled={disabled}
        >
          <Play className="w-5 h-5" />
          Analyze Image (YOLO11s + ResNet50)
        </Button>
        <div className="flex items-center justify-between">
          <StatusIndicator
            tone="online"
            label={isRealApiConfigured ? 'Backend Ready' : 'Backend Ready (Local Mock)'}
          />
        </div>
      </Card>
    </div>
  );
}
