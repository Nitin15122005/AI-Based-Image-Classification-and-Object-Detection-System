import { Image as ImageIcon, RefreshCcw, Trash2 } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import { formatBytes } from '../../utils/format.js';

export default function StagedImageCard({ previewUrl, filename, fileSizeBytes, width, height, format, onRemove, onReplace }) {
  return (
    <Card className="flex flex-col gap-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <ImageIcon className="w-5 h-5 text-secondary" strokeWidth={1.75} />
          <h3 className="font-headline-sm text-headline-sm text-primary">Staged Image</h3>
        </div>
        <Badge variant="secondary">Ready for Analysis</Badge>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch gap-space-md">
        <div className="relative w-full sm:w-56 h-36 rounded-xl overflow-hidden bg-surface-container-high shrink-0 shadow-inner">
          <img
            src={previewUrl}
            alt={`Preview of ${filename}`}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-grow flex flex-col justify-between py-0.5 space-y-space-sm min-w-0">
          <div className="space-y-space-xs">
            <div className="flex items-center justify-between gap-space-sm">
              <span className="font-headline-sm text-headline-sm text-primary truncate">{filename}</span>
              <div className="flex items-center gap-1 shrink-0">
                {onReplace && (
                  <button
                    type="button"
                    onClick={onReplace}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                    title="Replace image"
                    aria-label="Replace image"
                  >
                    <RefreshCcw className="w-[18px] h-[18px]" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onRemove}
                  className="p-1.5 rounded-lg hover:bg-error-container text-on-surface-variant hover:text-error transition-colors"
                  title="Remove image"
                  aria-label="Remove image"
                >
                  <Trash2 className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-surface-container-low text-on-surface font-code-sm text-code-sm">
              {width} × {height} px
            </span>
            <span className="px-2.5 py-1 rounded-md bg-surface-container-low text-on-surface font-code-sm text-code-sm">
              {formatBytes(fileSizeBytes)}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-surface-container-high text-on-surface-variant font-code-sm text-code-sm">
              {format}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
