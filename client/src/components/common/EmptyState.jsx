'use client';

import { SearchX, Inbox, FilterX } from 'lucide-react';

/**
 * Context-aware Empty State component
 * @param {Object} props
 * @param {boolean} [props.hasFilters] - Whether search/filters are currently applied
 * @param {Function} [props.onClearFilters] - Callback to clear active filters
 * @param {string} [props.title] - Custom title
 * @param {string} [props.message] - Custom description message
 */
export function EmptyState({ hasFilters = false, onClearFilters, title, message }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
        {hasFilters ? <SearchX className="w-7 h-7 text-amber-500" /> : <Inbox className="w-7 h-7 text-slate-400" />}
      </div>

      <h3 className="text-base font-semibold text-slate-800 mb-1">
        {title || (hasFilters ? 'No matching records found' : 'No records found')}
      </h3>

      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
        {message ||
          (hasFilters
            ? 'We couldn’t find any matches for your current search terms and filter selection. Try broadening your criteria.'
            : 'No data is available yet. Once new records are created, they will appear here.')}
      </p>

      {hasFilters && onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#1A2B4C] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#C5A059] rounded-lg transition-colors shadow-sm"
        >
          <FilterX className="w-4 h-4" />
          <span>Clear All Filters</span>
        </button>
      )}
    </div>
  );
}
