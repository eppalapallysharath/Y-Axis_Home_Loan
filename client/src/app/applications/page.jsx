'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { Filter, RotateCcw, Plus, Layers, Loader2 } from 'lucide-react';
import { useAuth } from '../../redux/hooks';
import { useApplications } from '../../hooks/useApplications';
import { useApplicationFilters } from '../../hooks/useApplicationFilters';
import { SearchInput } from '../../components/common/SearchInput';
import { MultiSelectFilter } from '../../components/common/MultiSelectFilter';
import { AssigneeFilter } from '../../components/common/AssigneeFilter';
import { DateRangePicker } from '../../components/common/DateRangePicker';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState } from '../../components/common/EmptyState';
import ApplicationTable from '../../components/applications/ApplicationTable';

const STAGE_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'WAITING_FOR_INFO', label: 'Waiting for Info' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'REJECTED', label: 'Rejected' },
];

const PRIORITY_OPTIONS = [
  { value: 'URGENT', label: '🔴 Urgent' },
  { value: 'HIGH', label: '🟠 High' },
  { value: 'MEDIUM', label: '🔵 Medium' },
  { value: 'LOW', label: '⚪ Low' },
];

const LOAN_TYPE_OPTIONS = [
  { value: 'HOME_LOAN', label: 'Home Loan' },
  { value: 'TOP_UP', label: 'Top-Up Loan' },
  { value: 'LAP', label: 'Loan Against Property (LAP)' },
];

function ApplicationsContent() {
  const { user } = useAuth();
  const isExecutive = user?.role === 'EXECUTIVE';

  const { filters, setFilter, clearFilters, hasActiveFilters, activeFilterCount } =
    useApplicationFilters();

  const { applications, pagination, loading, error } = useApplications(filters);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Loan Applications</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage, track, and process loan applications through the underwriting pipeline.
          </p>
        </div>
        <Link
          href="/applications/new"
          className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Application</span>
        </Link>
      </div>

      {/* Filter Panel Container */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        {/* Top Search Bar & Filter Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchInput
            value={filters.search}
            onChange={(search) => setFilter({ search })}
            placeholder="Search by customer name, PAN number, or Application ID..."
          />

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Filter className="w-3.5 h-3.5" />
                <span>{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
              </span>
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Structured Filter Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${isExecutive ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4 pt-4 border-t border-slate-100`}>
          <MultiSelectFilter
            label="Stage"
            options={STAGE_OPTIONS}
            selected={filters.stage}
            onChange={(stage) => setFilter({ stage })}
          />

          <MultiSelectFilter
            label="Priority"
            options={PRIORITY_OPTIONS}
            selected={filters.priority}
            onChange={(priority) => setFilter({ priority })}
          />

          <MultiSelectFilter
            label="Loan Type"
            options={LOAN_TYPE_OPTIONS}
            selected={filters.loanType}
            onChange={(loanType) => setFilter({ loanType })}
          />

          {!isExecutive && (
            <div className="space-y-4">
              <AssigneeFilter
                value={filters.assignedToId}
                onChange={(assignedToId) => setFilter({ assignedToId })}
              />
            </div>
          )}
        </div>

        {/* Date Range Picker Row */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <DateRangePicker
            fromDate={filters.fromDate}
            toDate={filters.toDate}
            onChange={({ fromDate, toDate }) => setFilter({ fromDate, toDate })}
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>Failed to load applications: {error}</span>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs font-medium text-slate-600">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          hasFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          title={hasActiveFilters ? 'No Applications Match Filters' : 'No Applications Found'}
          message={
            hasActiveFilters
              ? 'Try clearing active stage, priority, or search filters to view more records.'
              : 'There are no loan applications created in the system yet.'
          }
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <ApplicationTable
            applications={applications}
            loading={false}
            pagination={pagination}
            onPageChange={(page) => setFilter({ page })}
          />
          <Pagination
            total={pagination.total}
            page={pagination.page}
            limit={pagination.limit}
            totalPages={pagination.totalPages}
            onPageChange={(page) => setFilter({ page })}
          />
        </div>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Loading page state...</span>
        </div>
      }
    >
      <ApplicationsContent />
    </Suspense>
  );
}
