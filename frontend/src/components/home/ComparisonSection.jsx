import { useState } from 'react';
import { SectionHeading } from '../layout/Section.jsx';
import BoundingBoxOverlay from '../results/BoundingBoxOverlay.jsx';
import { MOCK_ANALYSES } from '../../data/mockData.js';
import { formatConfidence, formatMs, classNames } from '../../utils/format.js';

const showcase = MOCK_ANALYSES[0];

export default function ComparisonSection() {
  const [mode, setMode] = useState('analyzed');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
      <div className="lg:col-span-5 space-y-5">
        <SectionHeading
          eyebrow="Dual Canvas Inspector"
          title="Raw observation transformed into quantified data."
          description="Toggle between the unprocessed photo and the live detection overlay. VisionAI isolates each object down to a localized pixel boundary and a confidence score."
          className="mb-0 [&>div]:max-w-none"
        />
        <div className="inline-flex p-1.5 rounded-xl bg-surface-container-high">
          <button
            type="button"
            onClick={() => setMode('analyzed')}
            className={classNames(
              'px-4 py-2 rounded-lg font-label-md text-label-md transition-all',
              mode === 'analyzed'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface',
            )}
          >
            With AI Overlay
          </button>
          <button
            type="button"
            onClick={() => setMode('raw')}
            className={classNames(
              'px-4 py-2 rounded-lg font-label-md text-label-md transition-all',
              mode === 'raw'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface',
            )}
          >
            Raw Source
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-4">
          <div className="p-3.5 rounded-xl bg-surface-container-lowest shadow-sm">
            <span className="font-label-sm text-label-sm text-on-surface-variant block">Entities Found</span>
            <span className="font-headline-sm text-headline-sm text-primary font-bold">
              {showcase.detections.length} Objects
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-container-lowest shadow-sm">
            <span className="font-label-sm text-label-sm text-on-surface-variant block">Mean Certainty</span>
            <span className="font-headline-sm text-headline-sm text-primary font-bold">
              {formatConfidence(showcase.avgDetectionConfidence)}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-container-lowest shadow-sm">
            <span className="font-label-sm text-label-sm text-on-surface-variant block">Inference</span>
            <span className="font-headline-sm text-headline-sm text-primary font-bold">
              {formatMs(showcase.processingTimeMs)}
            </span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7">
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl bg-surface-container-lowest">
          <img
            alt="Street scene used to compare the raw photo against the AI-detected overlay"
            className="w-full h-full object-cover"
            src={showcase.originalImage}
          />
          <div
            className={classNames(
              'absolute inset-0 transition-opacity duration-300',
              mode === 'analyzed' ? 'opacity-100' : 'opacity-0',
            )}
          >
            <BoundingBoxOverlay detections={showcase.detections} />
          </div>
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-surface/90 backdrop-blur text-xs font-code-sm text-code-sm text-on-surface shadow-sm">
            Detection Overlay: {mode === 'analyzed' ? 'ON' : 'OFF'}
          </div>
        </div>
      </div>
    </div>
  );
}
