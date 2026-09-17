import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import AnalysisResultView from '../components/results/AnalysisResultView.jsx';
import { getHistoryItem, rerunAnalysis, deleteHistoryItem } from '../services/api.js';

export default function HistoryDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

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
    try {
      const result = await rerunAnalysis(analysis);
      navigate(`/results/${result.id}`);
    } catch (err) {
      setError(err.message || 'Re-run failed. Please try again.');
      setStatus('error');
    }
  }

  async function handleDelete() {
    if (!analysis) return;
    try {
      await deleteHistoryItem(analysis.id);
      navigate('/history');
    } catch (err) {
      setError(err.message || 'Delete failed. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'loading') {
    return (
      <PageContainer className="py-space-xl">
        <LoadingState title="Loading saved analysis…" description="Fetching this history record." />
      </PageContainer>
    );
  }

  if (status === 'error') {
    return (
      <PageContainer className="py-space-xl">
        <ErrorState title="Couldn't load this record" description={error} onRetry={load} retryLabel="Try again" />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-space-xl">
      <AnalysisResultView
        analysis={analysis}
        title="History · Analysis Detail"
        onRerun={handleRerun}
        onDelete={handleDelete}
        showDelete
      />
    </PageContainer>
  );
}
