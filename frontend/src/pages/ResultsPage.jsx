import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import AnalysisResultView from '../components/results/AnalysisResultView.jsx';
import { getHistoryItem, rerunAnalysis } from '../services/api.js';

export default function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [rerunning, setRerunning] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await getHistoryItem(id);
      setAnalysis(data);
      setStatus('loaded');
    } catch (err) {
      setError(err.message || 'Could not load this analysis.');
      setStatus('error');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRerun() {
    if (!analysis) return;
    setRerunning(true);
    try {
      const result = await rerunAnalysis(analysis);
      navigate(`/results/${result.id}`);
    } catch (err) {
      setError(err.message || 'Re-run failed. Please try again.');
      setStatus('error');
    } finally {
      setRerunning(false);
    }
  }

  if (status === 'loading') {
    return (
      <PageContainer className="py-space-xl flex flex-col gap-space-lg">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
        <LoadingState title="Loading analysis…" description="Fetching detection and classification results." />
      </PageContainer>
    );
  }

  if (status === 'error') {
    return (
      <PageContainer className="py-space-xl">
        <ErrorState
          title="Couldn't load this analysis"
          description={error}
          onRetry={load}
          retryLabel="Try again"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-space-xl">
      <AnalysisResultView
        analysis={analysis}
        title="Analysis Results"
        onRerun={rerunning ? undefined : handleRerun}
      />
    </PageContainer>
  );
}
