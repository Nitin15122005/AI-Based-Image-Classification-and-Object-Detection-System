import { useState } from 'react';
import ResultsHeader from './ResultsHeader.jsx';
import SummaryMetrics from './SummaryMetrics.jsx';
import DetectionCanvas from './DetectionCanvas.jsx';
import AiSummaryCard from './AiSummaryCard.jsx';
import TopPredictionsCard from './TopPredictionsCard.jsx';
import HardwareTelemetryCard from './HardwareTelemetryCard.jsx';
import DetectedObjectsTable from './DetectedObjectsTable.jsx';
import ActionFooter from './ActionFooter.jsx';
import { downloadResult } from '../../services/api.js';

/**
 * The full analysis-result experience (header, canvas, tables, summary
 * cards, actions). Shared by the Results page and the History Details page
 * so the two never diverge — see project-brain/02_UI_SPEC.md.
 */
export default function AnalysisResultView({ analysis, title, onRerun, onDelete, showDelete }) {
  const [viewMode, setViewMode] = useState('annotated');
  const [showBoxes, setShowBoxes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showConfidence, setShowConfidence] = useState(true);
  const [activeClass, setActiveClass] = useState('all');
  const [activeId, setActiveId] = useState(null);

  return (
    <div className="flex flex-col gap-space-lg">
      <ResultsHeader
        analysis={analysis}
        title={title}
        onRerun={onRerun}
        onDownloadJson={() => downloadResult(analysis, 'json')}
      />

      <SummaryMetrics analysis={analysis} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        <div className="lg:col-span-8">
          <DetectionCanvas
            analysis={analysis}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showBoxes={showBoxes}
            showLabels={showLabels}
            showConfidence={showConfidence}
            onToggleBoxes={setShowBoxes}
            onToggleLabels={setShowLabels}
            onToggleConfidence={setShowConfidence}
            activeClass={activeClass}
            onActiveClassChange={setActiveClass}
            activeId={activeId}
            onHoverBox={setActiveId}
            onDownloadImage={() => downloadResult(analysis, 'image')}
            onDownloadJson={() => downloadResult(analysis, 'json')}
          />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          <AiSummaryCard analysis={analysis} />
          <TopPredictionsCard predictions={analysis.topPredictions} />
          <HardwareTelemetryCard analysis={analysis} />
        </div>
      </div>

      <DetectedObjectsTable detections={analysis.detections} activeId={activeId} onRowHover={setActiveId} />

      <ActionFooter onRunAgain={onRerun} onDelete={onDelete} showDelete={showDelete} />
    </div>
  );
}
