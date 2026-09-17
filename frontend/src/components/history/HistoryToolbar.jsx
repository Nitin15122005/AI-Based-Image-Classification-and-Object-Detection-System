import { Search, ArrowUpDown } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Sort: Newest first' },
  { value: 'oldest', label: 'Sort: Oldest first' },
  { value: 'confidence', label: 'Sort: Highest confidence' },
  { value: 'objects', label: 'Sort: Most objects' },
];

export default function HistoryToolbar({ search, onSearchChange, sort, onSortChange, resultCount, totalCount }) {
  return (
    <div className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-center">
        <div className="md:col-span-8 relative">
          <Search className="w-5 h-5 absolute left-space-md top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by filename or detected class…"
            className="w-full pl-11 pr-space-md py-2.5 bg-surface-container-low rounded-lg text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary transition-all"
            aria-label="Search analysis history"
          />
        </div>
        <div className="md:col-span-4 relative">
          <ArrowUpDown className="w-4 h-4 absolute left-space-md top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full appearance-none bg-surface-container-low pl-11 pr-10 py-2.5 rounded-lg text-on-surface font-label-lg text-label-lg focus:outline-none focus:ring-1 focus:ring-secondary transition-all cursor-pointer"
            aria-label="Sort analysis history"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center justify-between pt-space-xs border-t border-surface-container text-outline font-label-sm text-label-sm">
        <span>
          Showing {resultCount} of {totalCount} analyses
        </span>
      </div>
    </div>
  );
}
