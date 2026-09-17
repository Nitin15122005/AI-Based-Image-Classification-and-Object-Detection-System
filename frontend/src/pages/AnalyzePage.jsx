import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import Badge from '../components/ui/Badge.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import UploadDropzone from '../components/analyze/UploadDropzone.jsx';
import StagedImageCard from '../components/analyze/StagedImageCard.jsx';
import AnalysisSettingsPanel from '../components/analyze/AnalysisSettingsPanel.jsx';
import InferencePipelinePanel from '../components/analyze/InferencePipelinePanel.jsx';
import FeatureHighlights from '../components/analyze/FeatureHighlights.jsx';
import { analyzeImage, analyzeSampleImage, getSampleImages, validateImageFile } from '../services/api.js';

const DEFAULT_SETTINGS = {
  detectionEnabled: true,
  classificationEnabled: true,
  confidenceThreshold: 0.25,
};

// Page states: idle -> selected -> analyzing -> (navigates away on success)
// An upload/analysis failure sets status back to 'error' with the prior
// source kept (if any) so the user can retry without re-selecting a file.
export default function AnalyzePage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle');
  const [source, setSource] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [stage, setStage] = useState('preparing');
  const [error, setError] = useState(null);
  const objectUrlRef = useRef(null);
  const samples = getSampleImages();

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function resetSource() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSource(null);
    setStatus('idle');
    setError(null);
  }

  function handleFileSelected(file) {
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      setStatus('error');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    objectUrlRef.current = previewUrl;

    const img = new Image();
    img.onload = () => {
      setSource({
        kind: 'file',
        file,
        previewUrl,
        filename: file.name,
        width: img.naturalWidth,
        height: img.naturalHeight,
        fileSizeBytes: file.size,
        format: (file.type.split('/')[1] || 'jpeg').toUpperCase(),
      });
      setStatus('selected');
      setError(null);
    };
    img.src = previewUrl;
  }

  function handleSampleSelected(sampleId) {
    const sample = samples.find((s) => s.id === sampleId);
    if (!sample) return;
    const { analysis } = sample;
    setSource({
      kind: 'sample',
      sampleId,
      previewUrl: analysis.originalImage,
      filename: analysis.filename,
      width: analysis.width,
      height: analysis.height,
      fileSizeBytes: analysis.fileSizeBytes,
      format: analysis.format,
    });
    setStatus('selected');
    setError(null);
  }

  async function handleAnalyze() {
    if (!source) return;
    setStatus('analyzing');
    setError(null);
    try {
      const onStageChange = (nextStage) => setStage(nextStage);
      const result =
        source.kind === 'sample'
          ? await analyzeSampleImage(source.sampleId, settings, { onStageChange })
          : await analyzeImage(source.file, settings, { onStageChange });
      navigate(`/results/${result.id}`);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
      setStatus('error');
    }
  }

  const showDropzone = status === 'idle' || (status === 'error' && !source);
  const showStaged = (status === 'selected' || status === 'analyzing' || status === 'error') && source;

  return (
    <PageContainer className="py-space-xl flex flex-col gap-space-xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="space-y-space-xs max-w-2xl">
          <Badge variant="secondary" dot>
            Dual-Stream Inference Ready
          </Badge>
          <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight">Analyze an Image</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Upload an image and let VisionAI detect and classify the objects inside it.
          </p>
        </div>
        <div className="px-space-md py-space-xs rounded-xl bg-surface-container-low shadow-sm flex items-center gap-2 self-start md:self-auto">
          <Server className="w-4 h-4 text-secondary" />
          <span className="font-code-sm text-code-sm text-on-surface-variant">Inference Worker</span>
          <span className="w-2 h-2 rounded-full bg-secondary" />
        </div>
      </div>

      {showDropzone && (
        <>
          <UploadDropzone
            onFileSelected={handleFileSelected}
            onSampleSelected={handleSampleSelected}
            samples={samples}
          />
          {status === 'error' && (
            <ErrorState title="Upload failed" description={error} onRetry={resetSource} retryLabel="Try again" />
          )}
        </>
      )}

      {showStaged && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <div className="lg:col-span-7 flex flex-col gap-space-lg">
            <StagedImageCard
              previewUrl={source.previewUrl}
              filename={source.filename}
              fileSizeBytes={source.fileSizeBytes}
              width={source.width}
              height={source.height}
              format={source.format}
              onRemove={resetSource}
              onReplace={resetSource}
            />
            {status === 'analyzing' && <InferencePipelinePanel stage={stage} />}
            {status === 'error' && (
              <ErrorState
                title="Analysis failed"
                description={error}
                onRetry={handleAnalyze}
                retryLabel="Retry analysis"
              />
            )}
          </div>
          <div className="lg:col-span-5">
            <AnalysisSettingsPanel
              settings={settings}
              onChange={setSettings}
              onAnalyze={handleAnalyze}
              disabled={status === 'analyzing'}
            />
          </div>
        </div>
      )}

      <FeatureHighlights />
    </PageContainer>
  );
}
