'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Builds page range array with ellipsis (...)
 * e.g., [1, 2, '...', 5, 6, 7, '...', 12]
 * @param {number} current
 * @param {number} total
 * @returns {Array<number|string>}
 */
function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

/**
 * Standard Pagination component
 * @param {Object} props
 * @param {number} props.total - Total count of records
 * @param {number} props.page - Current 1-indexed page
 * @param {number} props.limit - Records per page
 * @param {number} props.totalPages - Total calculated pages
 * @param {Function} props.onPageChange - Handler receiving next page number
 */
export function Pagination({ total = 0, page = 1, limit = 20, totalPages = 1, onPageChange }) {
  if (total <= 0) return null;

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);
  const pageRange = buildPageRange(page, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
      <div>
        Showing <span className="font-semibold text-slate-900">{startRecord}</span>–
        <span className="font-semibold text-slate-900">{endRecord}</span> of{' '}
        <span className="font-semibold text-slate-900">{total}</span> results
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-700 font-medium"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Prev</span>
        </button>

        <div className="flex items-center gap-1">
          {pageRange.map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 font-semibold select-none">
                …
              </span>
            ) : (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-all ${
                  p === page
                    ? 'bg-[#1A2B4C] text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-700 font-medium"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
