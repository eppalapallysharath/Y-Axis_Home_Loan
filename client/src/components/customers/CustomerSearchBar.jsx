'use client';

import { SearchInput } from '../common/SearchInput';
import { DateRangePicker } from '../common/DateRangePicker';
import { X, Filter, RotateCcw } from 'lucide-react';

export function CustomerSearchBar({ filters = {}, onFilterChange, onClearFilters }) {
  const hasActiveFilters = Boolean(
    filters.search || filters.employmentType || filters.fromDate || filters.toDate
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      {/* Top Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <SearchInput
          value={filters.search}
          onChange={(search) => onFilterChange({ search })}
          placeholder="Search by applicant name, email, phone, or PAN number..."
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shadow-sm whitespace-nowrap self-start sm:self-center"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Filter Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
        <div>
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Employment Type
          </label>
          <div className="relative">
            <select
              value={filters.employmentType || ''}
              onChange={(e) => onFilterChange({ employmentType: e.target.value || undefined })}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
            >
              <option value="">All Employment Types</option>
              <option value="SALARIED">Salaried</option>
              <option value="SELF_EMPLOYED">Self Employed</option>
              <option value="BUSINESS_OWNER">Business Owner</option>
              <option value="RETIRED">Retired</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <DateRangePicker
          fromDate={filters.fromDate}
          toDate={filters.toDate}
          onChange={({ fromDate, toDate }) => onFilterChange({ fromDate, toDate })}
        />
      </div>
    </div>
  );
}
