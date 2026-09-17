import { useCallback, useRef, useState } from 'react';
import { Download, FileJson, Plus, GripVertical } from 'lucide-react';
import BoundingBoxOverlay from './BoundingBoxOverlay.jsx';
import Button from '../ui/Button.jsx';
import Toggle from '../ui/Toggle.jsx';
import { classNames } from '../../utils/format.js';

const VIEW_MODES = [
  { key: 'annotated', label: 'Annotated' },
  { key: 'original', label: 'Original' },
  { key: 'split', label: 'Split View' },
];

export default function DetectionCanvas({
  analysis,
  showBoxes,
  showLabels,
  showConfidence,
  onToggleBoxes,
  onToggleLabels,
  onToggleConfidence,
  viewMode,
  onViewModeChange,
  activeClass,
  onActiveClassChange,
  activeId,
  onHoverBox,
  onDownloadImage,
  onDownloadJson,
}) {
  const containerRef = useRef(null);
  const [splitPercent, setSplitPercent] = useState(50);
  const draggingRef = useRef(false);

  const handlePointerMove = useCallback((event) => {
    if (!draggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const pct = Math.min(95, Math.max(5, (x / rect.width) * 100));
    setSplitPercent(pct);
  }, []);

  const stopDragging = useCallback(() => {
    draggingRef.current = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', stopDragging);
  }, [handlePointerMove]);

  const startDragging = useCallback(
    (event) => {
      event.preventDefault();
      draggingRef.current = true;
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', stopDragging);
    },
    [handlePointerMove, stopDragging],
  );

  const classCounts = analysis.classCounts || {};
  const classEntries = Object.entries(classCounts);
  const filteredDetections =
    activeClass === 'all' ? analysis.detections : analysis.detections.filter((d) => d.label === activeClass);

  const showAnnotationLayer = viewMode === 'annotated' || viewMode === 'split';

  return (
    <div className="flex flex-col gap-space-md">
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-space-md py-space-sm bg-surface-container-low flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center p-0.5 rounded-lg bg-surface-container">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() => onViewModeChange(mode.key)}
                className={classNames(
                  'px-space-sm py-1 rounded-md text-label-sm font-label-sm font-medium transition-all',
                  viewMode === mode.key
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary',
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-space-md">
            <Toggle id="toggle-boxes" checked={showBoxes} onChange={onToggleBoxes} label="Boxes" />
            <Toggle id="toggle-labels" checked={showLabels} onChange={onToggleLabels} label="Labels" />
            <Toggle id="toggle-confidence" checked={showConfidence} onChange={onToggleConfidence} label="Confidence" />
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative w-full bg-surface-container-high overflow-hidden select-none"
          style={{ aspectRatio: '16 / 9' }}
        >
          <img
            alt={`${viewMode === 'original' ? 'Original' : 'Annotated'} view of ${analysis.filename}`}
            className="w-full h-full object-cover block"
            src={analysis.originalImage}
          />

          {showAnnotationLayer && (
            <BoundingBoxOverlay
              detections={filteredDetections}
              showBoxes={showBoxes}
              showLabels={showLabels}
              showConfidence={showConfidence}
              activeId={activeId}
              onHoverBox={onHoverBox}
              onLeaveBox={() => onHoverBox(null)}
            />
          )}

          {viewMode === 'split' && (
            <>
              {/* Rendered after the overlay so it occludes boxes on the raw (left) side */}
              <div
                className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none"
                style={{ width: `${splitPercent}%` }}
              >
                <img
                  alt="Original (unannotated) comparison"
                  className="h-full object-cover block max-w-none"
                  style={{ width: `${(100 / splitPercent) * 100}%` }}
                  src={analysis.originalImage}
                />
              </div>
              <div
                className="absolute inset-y-0 w-1 bg-surface-container-lowest shadow-lg cursor-ew-resize flex items-center justify-center z-20 pointer-events-auto"
                style={{ left: `calc(${splitPercent}% - 2px)` }}
                onPointerDown={startDragging}
              >
                <span className="w-6 h-6 rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center text-on-surface-variant">
                  <GripVertical className="w-3.5 h-3.5" />
                </span>
              </div>
            </>
          )}

          <div className="absolute bottom-space-xs right-space-xs px-space-xs py-0.5 rounded bg-primary/80 backdrop-blur-md text-on-primary font-code-sm text-code-sm pointer-events-none">
            {analysis.width}×{analysis.height} · {filteredDetections.length} shown
          </div>
        </div>

        <div className="px-space-md py-space-sm bg-surface-container-lowest flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-xs">
            <Button variant="subtle" size="sm" onClick={onDownloadImage}>
              <Download className="w-[18px] h-[18px]" />
              Download Annotated Image
            </Button>
            <Button variant="subtle" size="sm" onClick={onDownloadJson}>
              <FileJson className="w-[18px] h-[18px]" />
              Download Results JSON
            </Button>
          </div>
          <Button to="/analyze" size="sm">
            <Plus className="w-[18px] h-[18px]" />
            Analyze Another Image
          </Button>
        </div>
      </div>

      {classEntries.length > 0 && (
        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex flex-wrap items-center gap-space-xs">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mr-1">
              Filter:
            </span>
            <button
              type="button"
              onClick={() => onActiveClassChange('all')}
              className={classNames(
                'px-2.5 py-1 rounded-md text-label-sm font-label-sm font-medium transition-all',
                activeClass === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest',
              )}
            >
              All ({analysis.detections.length})
            </button>
            {classEntries.map(([label, count]) => (
              <button
                key={label}
                type="button"
                onClick={() => onActiveClassChange(label)}
                className={classNames(
                  'px-2.5 py-1 rounded-md text-label-sm font-label-sm font-medium transition-all capitalize',
                  activeClass === label
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest',
                )}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
