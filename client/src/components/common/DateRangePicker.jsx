'use client';

import { X, Calendar } from 'lucide-react';

/**
 * Date Range Picker component for filtering created dates
 * @param {Object} props
 * @param {string} [props.fromDate] - ISO date string YYYY-MM-DD
 * @param {string} [props.toDate] - ISO date string YYYY-MM-DD
 * @param {Function} props.onChange - Callback ({ fromDate, toDate })
 */
export function DateRangePicker({ fromDate = '', toDate = '', onChange }) {
  const handleFromChange = (e) => {
    const val = e.target.value;
    onChange({ fromDate: val || undefined, toDate: toDate || undefined });
  };

  const handleToChange = (e) => {
    const val = e.target.value;
    onChange({ fromDate: fromDate || undefined, toDate: val || undefined });
  };

  const handleClear = () => {
    onChange({ fromDate: undefined, toDate: undefined });
  };

  const isInvalidRange = fromDate && toDate && new Date(fromDate) > new Date(toDate);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
          Created Date Range
        </label>
        {(fromDate || toDate) && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <input
            type="date"
            value={fromDate || ''}
            onChange={handleFromChange}
            placeholder="From Date"
            className={`w-full text-xs border rounded-lg p-2 bg-white text-slate-700 focus:ring-1 outline-none ${
              isInvalidRange
                ? 'border-rose-400 focus:ring-rose-500'
                : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
        </div>
        <div className="relative">
          <input
            type="date"
            value={toDate || ''}
            onChange={handleToChange}
            placeholder="To Date"
            className={`w-full text-xs border rounded-lg p-2 bg-white text-slate-700 focus:ring-1 outline-none ${
              isInvalidRange
                ? 'border-rose-400 focus:ring-rose-500'
                : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
        </div>
      </div>

      {isInvalidRange && (
        <p className="text-[10px] text-rose-500 font-medium">From date cannot be after To date</p>
      )}
    </div>
  );
}
