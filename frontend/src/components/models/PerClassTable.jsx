import { useMemo, useState } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { formatConfidence, classNames } from '../../utils/format.js';

const COLUMNS = [
  { key: 'name', label: 'Class Name', align: 'left' },
  { key: 'precision', label: 'Precision', align: 'right' },
  { key: 'recall', label: 'Recall', align: 'right' },
  { key: 'f1', label: 'F1-Score', align: 'right' },
  { key: 'support', label: 'Support', align: 'right' },
];

function performanceRating(f1) {
  if (f1 >= 0.9) return { label: 'Excellent', variant: 'text-emerald-600' };
  if (f1 >= 0.8) return { label: 'Good', variant: 'text-secondary' };
  if (f1 >= 0.7) return { label: 'Fair', variant: 'text-amber-600' };
  return { label: 'Needs review', variant: 'text-error' };
}

export default function PerClassTable({ data }) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('support');
  const [sortDir, setSortDir] = useState('desc');

  const rows = useMemo(() => {
    const filtered = data.filter((row) => row.name.toLowerCase().includes(query.toLowerCase()));
    const sorted = [...filtered].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (typeof a[sortKey] === 'string') return a[sortKey].localeCompare(b[sortKey]) * dir;
      return (a[sortKey] - b[sortKey]) * dir;
    });
    return sorted;
  }, [data, query, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary tracking-tight">Per-Class Performance</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Validation metrics per object category on the held-out test set.
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="w-[18px] h-[18px] text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter class names…"
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-1 focus:ring-secondary transition-all"
            aria-label="Filter classes"
          />
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left font-body-sm text-body-sm">
          <thead>
            <tr className="bg-surface-container text-on-surface font-label-md text-label-md">
              {COLUMNS.map((col) => (
                <th key={col.key} className={classNames('py-space-sm px-space-md select-none cursor-pointer', col.align === 'right' && 'text-right')}>
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className={classNames('inline-flex items-center gap-1', col.align === 'right' && 'flex-row-reverse')}
                  >
                    {col.label}
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </button>
                </th>
              ))}
              <th className="py-space-sm px-space-md">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high font-code-sm text-code-sm">
            {rows.map((row) => {
              const rating = performanceRating(row.f1);
              return (
                <tr key={row.name} className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-space-sm px-space-md font-semibold text-primary">{row.name}</td>
                  <td className="py-space-sm px-space-md text-right">{formatConfidence(row.precision)}</td>
                  <td className="py-space-sm px-space-md text-right">{formatConfidence(row.recall)}</td>
                  <td className="py-space-sm px-space-md text-right">{formatConfidence(row.f1)}</td>
                  <td className="py-space-sm px-space-md text-right">{row.support.toLocaleString()}</td>
                  <td className={classNames('py-space-sm px-space-md font-semibold', rating.variant)}>{rating.label}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="py-space-lg px-space-md text-center text-on-surface-variant">
                  No classes match &quot;{query}&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
