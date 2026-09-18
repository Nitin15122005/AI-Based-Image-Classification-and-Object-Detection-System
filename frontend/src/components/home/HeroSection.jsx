import { Camera, BarChart3, Brain, Timer, ScanLine } from 'lucide-react';
import PageContainer from '../layout/PageContainer.jsx';
import Button from '../ui/Button.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import BoundingBoxOverlay from '../results/BoundingBoxOverlay.jsx';
import { MOCK_ANALYSES } from '../../data/mockData.js';
import { formatConfidence, formatMs } from '../../utils/format.js';

const showcase = MOCK_ANALYSES[0];

export default function HeroSection() {
  return (
    <div className="relative w-full overflow-hidden">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[980px] max-w-[150vw] h-[360px] bg-gradient-to-b from-primary-fixed/40 via-secondary-fixed/20 to-transparent blur-3xl pointer-events-none -z-10" />

      <section className="w-full pt-8 md:pt-14 pb-16 md:pb-24">
        <PageContainer className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-space-xs px-3.5 py-1.5 rounded-full bg-surface-container-high shadow-sm mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest font-semibold">
              AI Computer Vision
            </span>
          </div>

          <h1 className="font-headline-xl text-headline-xl text-primary max-w-4xl tracking-tight leading-none mb-5 animate-fade-in">
            See More. Understand Better.
          </h1>

          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl text-center mb-8 leading-relaxed animate-fade-in">
            AI-powered image classification and object detection in one intelligent vision
            platform, powered by <span className="text-primary font-medium">YOLO11s</span> and{' '}
            <span className="text-primary font-medium">ResNet50</span>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-space-sm mb-14 animate-fade-in">
            <Button to="/analyze" size="lg" variant="primary">
              <Camera className="w-[18px] h-[18px]" />
              Analyze an Image
            </Button>
            <Button to="/models" size="lg" variant="secondary">
              <BarChart3 className="w-[18px] h-[18px]" />
              Explore Models &amp; Metrics
            </Button>
          </div>

          <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden bg-surface-container-lowest shadow-xl animate-scale-in">
            <div className="flex items-center justify-between px-space-md py-2.5 bg-surface-container-low text-on-surface-variant">
              <div className="flex items-center gap-space-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
                <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
                <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
                <span className="font-code-sm text-code-sm text-on-surface-variant/80 ml-2 truncate max-w-[160px] sm:max-w-none">
                  {showcase.filename}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-space-md font-code-sm text-code-sm">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container font-medium text-on-surface">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> {showcase.width} ×{' '}
                  {showcase.height}
                </span>
                <span className="text-on-surface-variant">Dual Pass Active</span>
              </div>
            </div>

            <div className="relative w-full aspect-[16/9] select-none group">
              <img
                alt="Urban street scene analyzed by VisionAI showing pedestrians, a taxi, and a cyclist with detection overlays"
                className="w-full h-full object-cover"
                src={showcase.originalImage}
              />
              <BoundingBoxOverlay detections={showcase.detections} />

              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 max-w-xs sm:max-w-md p-3 sm:p-4 rounded-xl bg-surface/90 backdrop-blur-md shadow-lg text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="w-[18px] h-[18px] text-secondary" />
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    ResNet50 Top-1 Classification
                  </span>
                </div>
                <p className="font-headline-sm text-headline-sm text-primary tracking-tight">
                  {showcase.sceneClassification}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <ProgressBar value={showcase.sceneConfidence * 100} className="flex-grow" height="h-1.5" />
                  <span className="font-code-sm text-code-sm text-primary font-semibold">
                    {formatConfidence(showcase.sceneConfidence)}
                  </span>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl bg-primary/90 backdrop-blur-md text-on-primary shadow-xl">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-highest/20 font-code-sm text-code-sm">
                  <Timer className="w-4 h-4 text-secondary-fixed" />
                  <span>{formatMs(showcase.processingTimeMs)} Latency</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-highest/20 font-code-sm text-code-sm">
                  <ScanLine className="w-4 h-4 text-secondary-fixed" />
                  <span>{showcase.detections.length} Objects Localized</span>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
