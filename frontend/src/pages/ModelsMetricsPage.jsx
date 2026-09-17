import { useCallback, useEffect, useState } from 'react';
import { Crop, Network } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import Card from '../components/ui/Card.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import PipelineStatusBanner from '../components/models/PipelineStatusBanner.jsx';
import ModelCard from '../components/models/ModelCard.jsx';
import TrainingChart from '../components/models/TrainingChart.jsx';
import ConfusionMatrixGrid from '../components/models/ConfusionMatrixGrid.jsx';
import PerClassTable from '../components/models/PerClassTable.jsx';
import SystemInfoCard from '../components/models/SystemInfoCard.jsx';
import { getModelMetrics } from '../services/api.js';

const DETECTION_METRIC_LABELS = [
  { key: 'map50', label: 'mAP@50' },
  { key: 'map5095', label: 'mAP50-95' },
  { key: 'precision', label: 'Precision' },
  { key: 'recall', label: 'Recall' },
  { key: 'mIoU', label: 'mIoU' },
];

const CLASSIFICATION_METRIC_LABELS = [
  { key: 'top1', label: 'Top-1' },
  { key: 'top5', label: 'Top-5' },
  { key: 'balancedAccuracy', label: 'Balanced Acc' },
  { key: 'macroF1', label: 'Macro F1' },
  { key: 'weightedF1', label: 'Weighted F1' },
];

export default function ModelsMetricsPage() {
  const [status, setStatus] = useState('loading');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setStatus('loading');
    getModelMetrics()
      .then((result) => {
        setData(result);
        setStatus('loaded');
      })
      .catch((err) => {
        setError(err.message || 'Could not load model metrics.');
        setStatus('error');
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (status === 'loading') {
    return (
      <PageContainer className="py-space-xl flex flex-col gap-space-lg">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </PageContainer>
    );
  }

  if (status === 'error') {
    return (
      <PageContainer className="py-space-xl">
        <ErrorState title="Couldn't load model metrics" description={error} onRetry={load} retryLabel="Try again" />
      </PageContainer>
    );
  }

  const { modelInfo, detection, classification, detectionTrainingCurve, classificationTrainingCurve, confusionMatrix, confusionMatrixClasses, perClassMetrics } = data;

  return (
    <PageContainer className="py-space-xl flex flex-col gap-space-xl">
      <div>
        <span className="font-code-sm text-code-sm text-on-surface-variant bg-surface-container-low px-space-sm py-1 rounded inline-block mb-space-xs">
          Evaluation snapshot &middot; mock data until models are trained
        </span>
        <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight">Models &amp; Evaluation</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mt-1">
          Architecture, benchmark metrics, and training evaluation for the dual-stream computer-vision
          pipeline. See project-brain/03_ML_BACKEND.md for the real evaluation plan.
        </p>
      </div>

      <PipelineStatusBanner />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        <ModelCard
          info={modelInfo.detection}
          metrics={detection}
          metricLabels={DETECTION_METRIC_LABELS}
          icon={Crop}
          badgeVariant="secondary"
          badgeLabel="Detection Stream"
          progressLabel="Mean IoU Score"
          progressValue={detection.mIoU}
        />
        <ModelCard
          info={modelInfo.classification}
          metrics={classification}
          metricLabels={CLASSIFICATION_METRIC_LABELS}
          icon={Network}
          badgeVariant="primary"
          badgeLabel="Classification Stream"
          progressLabel="Top-5 Accuracy"
          progressValue={classification.top5}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        <Card className="space-y-space-md">
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
              YOLO11s Detection
            </span>
            <h3 className="font-headline-sm text-headline-sm text-primary mt-1">Loss Descent &amp; mAP@50 Ascent</h3>
          </div>
          <TrainingChart
            data={detectionTrainingCurve}
            yDomain={[0, 0.65]}
            yTickFormatter={(v) => v.toFixed(2)}
            lines={[
              { dataKey: 'boxLoss', name: 'Box Loss', color: '#ba1a1a' },
              { dataKey: 'classLoss', name: 'Class Loss', color: '#8481ff' },
              { dataKey: 'map50', name: 'mAP@50', color: '#0058be' },
            ]}
          />
        </Card>
        <Card className="space-y-space-md">
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">
              ResNet50 Classification
            </span>
            <h3 className="font-headline-sm text-headline-sm text-primary mt-1">Accuracy vs. Cross-Entropy Loss</h3>
          </div>
          <TrainingChart
            data={classificationTrainingCurve}
            yDomain={[0, 1.7]}
            yTickFormatter={(v) => (v <= 1 ? `${Math.round(v * 100)}%` : v.toFixed(2))}
            lines={[
              { dataKey: 'trainAcc', name: 'Train Acc', color: '#091426' },
              { dataKey: 'valAcc', name: 'Val Acc', color: '#0058be' },
              { dataKey: 'valLoss', name: 'Val Loss', color: '#75777d', dashed: true },
            ]}
          />
        </Card>
      </div>

      <Card className="space-y-space-md">
        <div>
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">
            Classification Disambiguation
          </span>
          <h2 className="font-headline-md text-headline-md text-primary tracking-tight">
            Normalized Confusion Matrix (Top-10 Classes)
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Ground truth vs. predicted top-1 category on the held-out test set.
          </p>
        </div>
        <ConfusionMatrixGrid classes={confusionMatrixClasses} matrix={confusionMatrix} />
      </Card>

      <Card>
        <PerClassTable data={perClassMetrics} />
      </Card>

      <SystemInfoCard system={modelInfo.system} />
    </PageContainer>
  );
}
