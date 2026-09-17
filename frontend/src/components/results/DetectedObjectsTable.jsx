import Card from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { PackageSearch } from 'lucide-react';
import { formatConfidence, classNames } from '../../utils/format.js';
import { getDetectionColor } from '../../utils/colors.js';

export default function DetectedObjectsTable({ detections, activeId, onRowHover }) {
  if (!detections.length) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No objects detected"
        description="No objects met the confidence threshold for this analysis. Try lowering the threshold and analyzing again."
      />
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border-b border-surface-container">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">Detected Objects</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Detection and classification results for every localized object
          </p>
        </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant hidden sm:inline">
          Hover a row to highlight its box
        </span>
      </div>

      {/* Desktop / tablet table */}
      <div className="hidden md:block w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold w-12">#</th>
              <th className="py-3 px-4 font-semibold">Object</th>
              <th className="py-3 px-4 font-semibold">Detection Confidence</th>
              <th className="py-3 px-4 font-semibold">Classification</th>
              <th className="py-3 px-4 font-semibold">Classification Confidence</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm text-on-surface">
            {detections.map((det, i) => {
              const colors = getDetectionColor(det.colorClass);
              return (
                <tr
                  key={det.id}
                  onMouseEnter={() => onRowHover(det.id)}
                  onMouseLeave={() => onRowHover(null)}
                  className={classNames(
                    'transition-colors cursor-pointer border-t border-surface-container',
                    activeId === det.id ? 'bg-surface-container-high/60' : 'hover:bg-surface-container-high/40',
                  )}
                >
                  <td className="py-3.5 px-4 font-code-sm text-code-sm text-on-surface-variant">
                    {String(i + 1).padStart(2, '0')}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className={classNames('w-2.5 h-2.5 rounded shrink-0', colors.dot)} />
                      <span className="font-semibold text-primary capitalize">{det.label}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-surface-container h-1.5 rounded-full overflow-hidden">
                        <div className={classNames('h-full rounded-full', colors.bg)} style={{ width: `${det.detectionConfidence * 100}%` }} />
                      </div>
                      <span className="font-code-sm text-code-sm font-semibold text-primary">
                        {formatConfidence(det.detectionConfidence)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-on-surface">{det.classification}</td>
                  <td className="py-3.5 px-4">
                    <span className={classNames('px-2 py-0.5 rounded-full font-code-sm text-code-sm font-medium', colors.softBg, colors.softText)}>
                      {formatConfidence(det.classificationConfidence)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden divide-y divide-surface-container">
        {detections.map((det, i) => {
          const colors = getDetectionColor(det.colorClass);
          return (
            <div
              key={det.id}
              onTouchStart={() => onRowHover(det.id)}
              className={classNames('p-space-md flex flex-col gap-space-xs', activeId === det.id && 'bg-surface-container-high/40')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={classNames('w-2.5 h-2.5 rounded shrink-0', colors.dot)} />
                  <span className="font-semibold text-primary capitalize">{det.label}</span>
                </div>
                <span className="font-code-sm text-code-sm text-on-surface-variant">
                  #{String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center justify-between text-body-sm font-body-sm">
                <span className="text-on-surface-variant">Detection</span>
                <span className="font-code-sm text-code-sm font-semibold text-primary">
                  {formatConfidence(det.detectionConfidence)}
                </span>
              </div>
              <div className="flex items-center justify-between text-body-sm font-body-sm gap-space-sm">
                <span className="text-on-surface-variant shrink-0">Classification</span>
                <span className="text-on-surface text-right truncate">{det.classification}</span>
              </div>
              <div className="flex items-center justify-between text-body-sm font-body-sm">
                <span className="text-on-surface-variant">Class Confidence</span>
                <span className={classNames('px-2 py-0.5 rounded-full font-code-sm text-code-sm font-medium', colors.softBg, colors.softText)}>
                  {formatConfidence(det.classificationConfidence)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
