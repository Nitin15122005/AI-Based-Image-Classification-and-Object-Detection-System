import { RefreshCcw, Image as ImageIcon, Clock, Zap } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { formatDateTime, formatMs } from '../../utils/format.js';

export default function ResultsHeader({ analysis, onRerun, onDownloadJson, title = 'Analysis Results' }) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-md">
      <div className="space-y-space-xs">
        <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">{title}</h1>
        <div className="flex flex-wrap items-center gap-x-space-md gap-y-space-xs pt-1 text-on-surface-variant font-body-sm text-body-sm">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4" />
            <span className="font-code-sm text-code-sm font-semibold text-primary">{analysis.filename}</span>
          </div>
          <span className="text-outline-variant">&bull;</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{formatDateTime(analysis.createdAt)}</span>
          </div>
          <span className="text-outline-variant">&bull;</span>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-secondary" />
            <span className="font-medium text-secondary">{formatMs(analysis.processingTimeMs)} processing time</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-space-xs self-start xl:self-auto">
        <Button variant="secondary" size="sm" onClick={onRerun}>
          <RefreshCcw className="w-[18px] h-[18px]" />
          Re-run
        </Button>
        <Button size="sm" onClick={onDownloadJson}>
          Export JSON
        </Button>
      </div>
    </div>
  );
}
