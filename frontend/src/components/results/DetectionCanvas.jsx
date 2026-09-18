import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Download,
  FileJson,
  Plus,
  Minus,
  RotateCcw,
  GripVertical,
} from 'lucide-react';
import BoundingBoxOverlay from './BoundingBoxOverlay.jsx';
import Button from '../ui/Button.jsx';
import Toggle from '../ui/Toggle.jsx';
import { classNames } from '../../utils/format.js';

const VIEW_MODES = [
  { key: 'annotated', label: 'Annotated' },
  { key: 'original', label: 'Original' },
  { key: 'split', label: 'Split View' },
];

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
const DEFAULT_ZOOM = 1;

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
  /*
   * frameRef:
   * Measures only the fixed image frame.
   *
   * viewport:
   * The inner scrollable area.
   *
   * Keeping these separate prevents resize/zoom/scroll feedback loops.
   */
  const frameRef = useRef(null);
  const imageBoxRef = useRef(null);
  const draggingRef = useRef(false);

  const [splitPercent, setSplitPercent] = useState(50);

  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const [frameSize, setFrameSize] = useState({
    width: 0,
    height: 0,
  });

  /*
   * ------------------------------------------------------------
   * FRAME MEASUREMENT
   * ------------------------------------------------------------
   */

  useEffect(() => {
    const frame = frameRef.current;

    if (!frame || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const measure = () => {
      const rect = frame.getBoundingClientRect();

      setFrameSize({
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height)),
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(frame);

    return () => observer.disconnect();
  }, []);

  /*
   * Reset zoom when the current analysis changes.
   */
  useEffect(() => {
    setZoom(DEFAULT_ZOOM);
  }, [analysis?.id, analysis?.filename]);

  /*
   * ------------------------------------------------------------
   * SOURCE / FIT CALCULATION
   * ------------------------------------------------------------
   */

  const sourceWidth = Math.max(
    1,
    Number(analysis.width) || 1,
  );

  const sourceHeight = Math.max(
    1,
    Number(analysis.height) || 1,
  );

  const frameWidth = Math.max(
    1,
    frameSize.width,
  );

  const frameHeight = Math.max(
    1,
    frameSize.height,
  );

  /*
   * Fit the entire image inside the fixed frame.
   *
   * This preserves the original aspect ratio and prevents
   * object-cover style cropping.
   */
  const fitScale = Math.min(
    frameWidth / sourceWidth,
    frameHeight / sourceHeight,
  );

  /*
   * 100% = fit-to-frame.
   * >100% = zoom in.
   * <100% = zoom out.
   */
  const renderedWidth = Math.max(
    1,
    Math.round(
      sourceWidth * fitScale * zoom,
    ),
  );

  const renderedHeight = Math.max(
    1,
    Math.round(
      sourceHeight * fitScale * zoom,
    ),
  );

  /*
   * Stage stays at least as large as the fixed frame.
   *
   * This means:
   * - 100%: image fits
   * - <100%: image centered
   * - >100%: stage grows and scrollbars appear
   */
  const stageWidth = Math.max(
    frameWidth,
    renderedWidth,
  );

  const stageHeight = Math.max(
    frameHeight,
    renderedHeight,
  );

  /*
   * Center image inside the stage.
   */
  const imageLeft = Math.round(
    (stageWidth - renderedWidth) / 2,
  );

  const imageTop = Math.round(
    (stageHeight - renderedHeight) / 2,
  );

  const imageStyle = {
    position: 'absolute',
    left: imageLeft,
    top: imageTop,
    width: renderedWidth,
    height: renderedHeight,
  };

  /*
   * ------------------------------------------------------------
   * ZOOM
   * ------------------------------------------------------------
   */

  const setSafeZoom = useCallback((value) => {
    const next = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, value),
    );

    setZoom(Number(next.toFixed(2)));
  }, []);

  const zoomIn = useCallback(() => {
    setSafeZoom(zoom + ZOOM_STEP);
  }, [setSafeZoom, zoom]);

  const zoomOut = useCallback(() => {
    setSafeZoom(zoom - ZOOM_STEP);
  }, [setSafeZoom, zoom]);

  const resetZoom = useCallback(() => {
    setZoom(DEFAULT_ZOOM);
  }, []);

  /*
   * ------------------------------------------------------------
   * SPLIT VIEW DRAGGING
   * ------------------------------------------------------------
   */

  const handlePointerMove = useCallback((event) => {
    if (
      !draggingRef.current ||
      !imageBoxRef.current
    ) {
      return;
    }

    const rect =
      imageBoxRef.current.getBoundingClientRect();

    if (rect.width <= 0) {
      return;
    }

    const x =
      event.clientX - rect.left;

    const percentage =
      (x / rect.width) * 100;

    setSplitPercent(
      Math.min(
        95,
        Math.max(5, percentage),
      ),
    );
  }, []);

  const stopDragging = useCallback(() => {
    draggingRef.current = false;

    window.removeEventListener(
      'pointermove',
      handlePointerMove,
    );

    window.removeEventListener(
      'pointerup',
      stopDragging,
    );
  }, [handlePointerMove]);

  const startDragging = useCallback(
    (event) => {
      event.preventDefault();

      draggingRef.current = true;

      window.addEventListener(
        'pointermove',
        handlePointerMove,
      );

      window.addEventListener(
        'pointerup',
        stopDragging,
      );
    },
    [handlePointerMove, stopDragging],
  );

  /*
   * Cleanup listeners on unmount.
   */
  useEffect(() => {
    return () => {
      window.removeEventListener(
        'pointermove',
        handlePointerMove,
      );

      window.removeEventListener(
        'pointerup',
        stopDragging,
      );
    };
  }, [handlePointerMove, stopDragging]);

  /*
   * ------------------------------------------------------------
   * DETECTIONS
   * ------------------------------------------------------------
   */

  const classCounts = analysis.classCounts || {};

  const classEntries =
    Object.entries(classCounts);

  const filteredDetections =
    activeClass === 'all'
      ? analysis.detections
      : analysis.detections.filter(
          (d) => d.label === activeClass,
        );

  const showAnnotationLayer =
    viewMode === 'annotated' ||
    viewMode === 'split';

  const zoomPercent =
    Math.round(zoom * 100);

  /*
   * ------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------
   */

  return (
    <div className="flex flex-col gap-space-md">

      {/* ===================================================== */}
      {/* RESULT CARD                                           */}
      {/* ===================================================== */}

      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">

        {/* ================================================= */}
        {/* HEADER                                            */}
        {/* ================================================= */}

        <div className="px-space-md py-space-sm bg-surface-container-low flex flex-wrap items-center justify-between gap-space-sm">

          {/* View modes */}
          <div className="flex items-center p-0.5 rounded-lg bg-surface-container">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() =>
                  onViewModeChange(mode.key)
                }
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

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-space-md">

            {/* Zoom controls */}
            <div
              className="flex items-center gap-1 rounded-lg bg-surface-container p-1"
              aria-label="Image zoom controls"
            >
              <button
                type="button"
                onClick={zoomOut}
                disabled={zoom <= MIN_ZOOM}
                aria-label="Zoom out"
                title="Zoom out"
                className={classNames(
                  'w-7 h-7 rounded-md flex items-center justify-center transition-colors',
                  zoom <= MIN_ZOOM
                    ? 'text-on-surface-variant/40 cursor-not-allowed'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary',
                )}
              >
                <Minus className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={resetZoom}
                aria-label="Fit image to frame"
                title="Fit image to frame"
                className="min-w-[56px] px-2 h-7 rounded-md text-label-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
              >
                {zoomPercent}%
              </button>

              <button
                type="button"
                onClick={zoomIn}
                disabled={zoom >= MAX_ZOOM}
                aria-label="Zoom in"
                title="Zoom in"
                className={classNames(
                  'w-7 h-7 rounded-md flex items-center justify-center transition-colors',
                  zoom >= MAX_ZOOM
                    ? 'text-on-surface-variant/40 cursor-not-allowed'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary',
                )}
              >
                <Plus className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={resetZoom}
                aria-label="Reset image to fit"
                title="Reset image to fit"
                className="w-7 h-7 rounded-md flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Detection controls */}
            <Toggle
              id="toggle-boxes"
              checked={showBoxes}
              onChange={onToggleBoxes}
              label="Boxes"
            />

            <Toggle
              id="toggle-labels"
              checked={showLabels}
              onChange={onToggleLabels}
              label="Labels"
            />

            <Toggle
              id="toggle-confidence"
              checked={showConfidence}
              onChange={onToggleConfidence}
              label="Confidence"
            />
          </div>
        </div>

        {/* ================================================= */}
        {/* FIXED IMAGE FRAME                                 */}
        {/* ================================================= */}

        <div
          ref={frameRef}
          className="relative w-full bg-surface-container-high overflow-hidden select-none"
          style={{
            aspectRatio: '16 / 9',
          }}
        >
          {/* ================================================= */}
          {/* SCROLLABLE VIEWPORT                               */}
          {/* ================================================= */}

          <div
            className="absolute inset-0 overflow-auto overscroll-contain"
            style={{
              scrollbarGutter:
                'stable both-edges',
            }}
          >
            {/* ================================================= */}
            {/* STAGE                                             */}
            {/* ================================================= */}

            <div
              className="relative"
              style={{
                width: stageWidth,
                height: stageHeight,
              }}
            >

              {/* ============================================= */}
              {/* IMAGE + ANNOTATION COORDINATE SPACE           */}
              {/* ============================================= */}

              <div
                ref={imageBoxRef}
                className="relative"
                style={imageStyle}
              >

                {/* =========================================== */}
                {/* BASE IMAGE                                  */}
                {/* =========================================== */}

                <img
                  alt={`${viewMode === 'original' ? 'Original' : 'Annotated'} view of ${analysis.filename}`}
                  src={analysis.originalImage}
                  draggable={false}
                  className="absolute inset-0 block w-full h-full pointer-events-none"
                  style={{
                    objectFit: 'fill',
                  }}
                />

                {/* =========================================== */}
                {/* ANNOTATION LAYER                             */}
                {/* =========================================== */}

                {showAnnotationLayer && (
                  <BoundingBoxOverlay
                    detections={filteredDetections}
                    showBoxes={showBoxes}
                    showLabels={showLabels}
                    showConfidence={showConfidence}
                    activeId={activeId}
                    onHoverBox={onHoverBox}
                    onLeaveBox={() =>
                      onHoverBox(null)
                    }
                  />
                )}

                {/* =========================================== */}
                {/* SPLIT VIEW                                  */}
                {/* =========================================== */}

                {viewMode === 'split' && (
                  <>
                    {/* --------------------------------------- */}
                    {/* ORIGINAL IMAGE SIDE                     */}
                    {/* --------------------------------------- */}

                    <div
                      className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none"
                      style={{
                        width: `${splitPercent}%`,
                      }}
                    >
                      <img
                        alt="Original (unannotated) comparison"
                        src={analysis.originalImage}
                        draggable={false}
                        className="absolute inset-0 block max-w-none w-full h-full pointer-events-none"
                        style={{
                          objectFit: 'fill',
                          width: imageStyle.width,
                          height: imageStyle.height,
                        }}
                      />
                    </div>

                    {/* --------------------------------------- */}
                    {/* ORIGINAL-SIDE HOVER SHIELD              */}
                    {/* --------------------------------------- */}

                    {/*
                      IMPORTANT:
                      This transparent layer sits above the
                      detection overlay on the Original side.

                      Therefore hovering an object on the
                      Original side cannot trigger the
                      BoundingBoxOverlay hover frame.

                      The divider is z-20, so it remains fully
                      draggable.
                    */}
                    <div
                      className="absolute inset-y-0 left-0 z-10 pointer-events-auto bg-transparent"
                      style={{
                        width: `${splitPercent}%`,
                      }}
                      aria-hidden="true"
                    />

                    {/* --------------------------------------- */}
                    {/* SPLIT DIVIDER                            */}
                    {/* --------------------------------------- */}

                    <div
                      className="absolute inset-y-0 w-1 bg-surface-container-lowest shadow-lg cursor-ew-resize flex items-center justify-center z-20 pointer-events-auto"
                      style={{
                        left:
                          `calc(${splitPercent}% - 2px)`,
                      }}
                      onPointerDown={
                        startDragging
                      }
                    >
                      <span className="w-6 h-6 rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center text-on-surface-variant">
                        <GripVertical className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ================================================= */}
          {/* IMAGE META                                        */}
          {/* ================================================= */}

          <div className="absolute bottom-space-xs right-space-xs px-space-xs py-0.5 rounded bg-primary/80 backdrop-blur-md text-on-primary font-code-sm text-code-sm pointer-events-none">
            {analysis.width}×{analysis.height} ·{' '}
            {filteredDetections.length} shown ·{' '}
            {zoomPercent}%
          </div>
        </div>

        {/* ================================================= */}
        {/* FOOTER                                             */}
        {/* ================================================= */}

        <div className="px-space-md py-space-sm bg-surface-container-lowest flex flex-wrap items-center justify-between gap-space-sm">

          <div className="flex items-center gap-space-xs">

            <Button
              variant="subtle"
              size="sm"
              onClick={onDownloadImage}
            >
              <Download className="w-[18px] h-[18px]" />
              Download Annotated Image
            </Button>

            <Button
              variant="subtle"
              size="sm"
              onClick={onDownloadJson}
            >
              <FileJson className="w-[18px] h-[18px]" />
              Download Results JSON
            </Button>

          </div>

          <Button
            to="/analyze"
            size="sm"
          >
            <Plus className="w-[18px] h-[18px]" />
            Analyze Another Image
          </Button>

        </div>
      </div>

      {/* ===================================================== */}
      {/* CLASS FILTERS                                         */}
      {/* ===================================================== */}

      {classEntries.length > 0 && (
        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-wrap items-center justify-between gap-space-sm">

          <div className="flex flex-wrap items-center gap-space-xs">

            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mr-1">
              Filter:
            </span>

            <button
              type="button"
              onClick={() =>
                onActiveClassChange('all')
              }
              className={classNames(
                'px-2.5 py-1 rounded-md text-label-sm font-label-sm font-medium transition-all',
                activeClass === 'all'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest',
              )}
            >
              All ({analysis.detections.length})
            </button>

            {classEntries.map(
              ([label, count]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    onActiveClassChange(label)
                  }
                  className={classNames(
                    'px-2.5 py-1 rounded-md text-label-sm font-label-sm font-medium transition-all capitalize',
                    activeClass === label
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest',
                  )}
                >
                  {label} ({count})
                </button>
              ),
            )}

          </div>
        </div>
      )}
    </div>
  );
}