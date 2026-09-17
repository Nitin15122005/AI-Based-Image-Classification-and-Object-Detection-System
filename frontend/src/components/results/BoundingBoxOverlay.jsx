import { classNames, formatConfidence, titleCase } from '../../utils/format.js';

/**
 * Renders detection bounding boxes as absolutely-positioned elements over an
 * image, using percentage-based coordinates so it scales with any rendered
 * image size. This is what a real backend's per-object bbox + class +
 * confidence payload would drive (see project-brain/03_ML_BACKEND.md).
 */
export default function BoundingBoxOverlay({
  detections,
  showBoxes = true,
  showLabels = true,
  showConfidence = true,
  activeId = null,
  onHoverBox,
  onLeaveBox,
}) {
  if (!showBoxes || !detections?.length) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {detections.map((det) => {
        const isActive = activeId === det.id;
        return (
          <div
            key={det.id}
            className={classNames(
              'absolute pointer-events-auto cursor-pointer transition-transform duration-200',
              isActive && 'z-10 scale-[1.02]',
            )}
            style={{
              left: `${det.bbox.x}%`,
              top: `${det.bbox.y}%`,
              width: `${det.bbox.width}%`,
              height: `${det.bbox.height}%`,
            }}
            onMouseEnter={() => onHoverBox?.(det.id)}
            onMouseLeave={() => onLeaveBox?.()}
          >
            <div
              className={classNames(
                'w-full h-full rounded-sm relative shadow-[0_0_0_1px_rgba(255,255,255,0.9)]',
                isActive ? 'border-[3px]' : 'border-2',
              )}
              style={{ borderColor: det.hexColor }}
            >
              {(showLabels || showConfidence) && (
                <span
                  className="absolute -top-6 left-0 px-1.5 py-0.5 rounded font-label-sm text-label-sm whitespace-nowrap shadow-sm text-white"
                  style={{ backgroundColor: det.hexColor }}
                >
                  {showLabels && titleCase(det.label)}
                  {showLabels && showConfidence && ' '}
                  {showConfidence && formatConfidence(det.detectionConfidence)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
