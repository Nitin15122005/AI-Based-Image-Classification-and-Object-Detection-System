import { useEffect, useState } from 'react';
import { Trash2, ImagePlus, Database } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import HistoryToolbar from '../components/history/HistoryToolbar.jsx';
import HistoryListItem from '../components/history/HistoryListItem.jsx';
import { getHistory } from '../services/api.js';

export default function HistoryPage() {
  const [status, setStatus] = useState('loading');
  const [items, setItems] = useState([]);
  const [allCount, setAllCount] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    getHistory({ search, sort })
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setStatus('loaded');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Could not load history.');
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [search, sort, reloadToken]);

  useEffect(() => {
    getHistory({}).then((all) => setAllCount(all.length)).catch(() => {});
  }, []);

  return (
    <PageContainer className="py-space-xl flex flex-col gap-space-xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md border-b border-surface-container pb-space-lg">
        <div className="flex flex-col gap-space-xs max-w-2xl">
          <Badge variant="neutral" dot>
            Inference Registry
          </Badge>
          <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight">Analysis History</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Review, search, and reopen your previous computer-vision analyses.
          </p>
        </div>
        <Button to="/analyze" size="md">
          <ImagePlus className="w-[18px] h-[18px]" />
          New Analysis
        </Button>
      </div>

      <HistoryToolbar
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        resultCount={items.length}
        totalCount={allCount}
      />

      {status === 'loading' && (
        <div className="flex flex-col gap-space-md">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      )}

      {status === 'error' && (
        <ErrorState title="Couldn't load history" description={error} onRetry={() => setReloadToken((t) => t + 1)} />
      )}

      {status === 'loaded' && items.length === 0 && allCount === 0 && (
        <EmptyState
          icon={Database}
          title="No analyses yet"
          description="Run your first image through VisionAI to start building your analysis history."
          action={
            <Button to="/analyze" variant="primary">
              Analyze your first image
            </Button>
          }
        />
      )}

      {status === 'loaded' && items.length === 0 && allCount > 0 && (
        <EmptyState
          icon={Trash2}
          title="No analyses found matching query"
          description="There are currently no analyses recorded under this search or filter. Try a different query."
          action={
            <Button variant="secondary" onClick={() => setSearch('')}>
              Clear search
            </Button>
          }
        />
      )}

      {status === 'loaded' && items.length > 0 && (
        <div className="flex flex-col gap-space-md">
          {items.map((analysis) => (
            <HistoryListItem key={analysis.id} analysis={analysis} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
