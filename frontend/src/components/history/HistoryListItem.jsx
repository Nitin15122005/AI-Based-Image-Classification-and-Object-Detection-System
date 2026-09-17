import { Link } from 'react-router-dom';
import { Eye, Download, Boxes, Gauge } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import { formatConfidence, formatRelativeDate, titleCase } from '../../utils/format.js';
import { downloadResult } from '../../services/api.js';

export default function HistoryListItem({ analysis }) {
  const classEntries = Object.entries(analysis.classCounts || {}).slice(0, 4);
  const objectCount = analysis.detections.length;

  return (
    <Link
      to={`/history/${analysis.id}`}
      className="group relative bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-space-lg"
    >
      <div className="relative w-full md:w-56 h-44 rounded-lg overflow-hidden bg-surface-container shrink-0 shadow-inner">
        <img
          src={analysis.originalImage}
          alt={`Thumbnail for ${analysis.filename}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 left-2 px-space-xs py-0.5 rounded bg-primary/80 backdrop-blur-md text-on-primary font-code-sm text-code-sm">
          YOLO11s + ResNet50
        </div>
      </div>

      <div className="flex flex-col justify-between flex-grow min-w-0">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center justify-between gap-space-sm">
            <h3 className="font-headline-sm text-headline-sm text-primary truncate">{analysis.filename}</h3>
            <Badge variant="secondary" dot className="shrink-0">
              Completed
            </Badge>
          </div>
          <div className="flex items-center gap-space-md text-on-surface-variant font-code-sm text-code-sm">
            <span>{formatRelativeDate(analysis.createdAt)}</span>
            <span>&bull;</span>
            <span>{analysis.width} × {analysis.height} px</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-space-xs">
            <span className="font-label-sm text-label-sm text-on-surface font-semibold mr-1">
              {objectCount} object{objectCount === 1 ? '' : 's'}:
            </span>
            {classEntries.length ? (
              classEntries.map(([label, count]) => (
                <span key={label} className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant font-code-sm text-code-sm capitalize">
                  {titleCase(label)} {count > 1 ? `(${count})` : ''}
                </span>
              ))
            ) : (
              <span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant font-code-sm text-code-sm">
                None above threshold
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-md mt-space-xs border-t border-surface-container">
          <div className="flex items-center gap-space-lg">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-secondary" />
              <div>
                <span className="block font-label-sm text-label-sm text-outline">Avg Confidence</span>
                <span className="font-headline-sm text-headline-sm text-secondary font-semibold">
                  {formatConfidence(analysis.avgDetectionConfidence)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-primary" />
              <div>
                <span className="block font-label-sm text-label-sm text-outline">Latency</span>
                <span className="font-headline-sm text-headline-sm text-primary font-semibold">
                  {analysis.processingTimeMs} ms
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="px-space-md py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors inline-flex items-center gap-1">
              <Eye className="w-4 h-4" />
              View Details
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                downloadResult(analysis, 'json');
              }}
              className="px-space-sm py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-label-md text-label-md transition-colors inline-flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              JSON
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
