'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSyncJobs } from '../../../hooks/useSyncJobs';
import CbsSyncBadge from '../../../components/applications/CbsSyncBadge';
import StageBadge from '../../../components/applications/StageBadge';
import { Pagination } from '../../../components/common/Pagination';
import { EmptyState } from '../../../components/common/EmptyState';
import CbsHealthWidget from '../../../components/cbs/CbsHealthWidget';
import { RoleGate } from '../../../components/auth/RoleGate';
import { RefreshCw, Filter, ShieldAlert } from 'lucide-react';

const STATUS_TABS = [
  { id: 'ALL', label: 'All Jobs' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'IN_PROGRESS', label: 'Syncing' },
  { id: 'SUCCESS', label: 'Synced' },
  { id: 'FAILED', label: 'Failed' },
  { id: 'EXHAUSTED', label: 'Exhausted' },
];

export default function AdminSyncJobsPage() {
  const { jobs, pagination, loading, error, filters, updateFilters, refetch } = useSyncJobs({
    status: 'ALL',
    page: 1,
    limit: 15,
  });

  const [expandedJobId, setExpandedJobId] = useState(null);

  const handleTabChange = (status) => {
    updateFilters({ status, page: 1 });
  };

  const handlePageChange = (page) => {
    updateFilters({ page });
  };

  const toggleExpand = (id) => {
    setExpandedJobId(expandedJobId === id ? null : id);
  };

  return (
    <RoleGate allowedRoles={['ADMIN', 'MANAGER']}>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
              <span>Administration</span>
              <span>/</span>
              <span className="text-slate-800 font-medium">CBS Sync Monitor</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Core Banking System Integration</span>
            </h1>
          </div>

          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Monitor</span>
          </button>
        </div>

        {/* CBS Health Widget */}
        <CbsHealthWidget />

        {/* Status Filter Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {STATUS_TABS.map((tab) => {
              const isActive = (filters.status || 'ALL') === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 px-3 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Showing {jobs.length} of {pagination.total} jobs
            </span>
          </div>
        </div>

        {/* Sync Jobs Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading && jobs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mb-3" />
              <p>Fetching CBS sync job logs...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-600 text-xs">
              <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="font-bold">Failed to load sync jobs</p>
              <p className="mt-1 text-slate-500">{error}</p>
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              icon="🏦"
              title="No CBS Sync Jobs Found"
              description="No loan application sync jobs match the selected status filter."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="py-3 px-4">Application</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Loan Details</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">CBS Status</th>
                    <th className="py-3 px-4">Attempts</th>
                    <th className="py-3 px-4">Last Updated</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((job) => {
                    const isExpanded = expandedJobId === job.id;
                    const app = job.application || {};
                    const cust = app.customer || {};

                    return (
                      <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-blue-600">
                          <Link href={`/applications/${job.applicationId}`} className="hover:underline">
                            #{job.applicationId}
                          </Link>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{cust.fullName || 'N/A'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">PAN: {cust.panNumber || 'N/A'}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">
                            ₹{Number(app.loanAmount || 0).toLocaleString('en-IN')}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {app.applicationType === 'HOME_LOAN'
                              ? 'Home Loan'
                              : app.applicationType === 'TOP_UP'
                              ? 'Top-Up'
                              : 'LAP'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <StageBadge stage={app.stage} />
                        </td>

                        <td className="py-3.5 px-4">
                          <CbsSyncBadge
                            status={job.status}
                            syncJob={job}
                            applicationId={job.applicationId}
                            onRetrySuccess={refetch}
                          />
                        </td>

                        <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                          {job.attempts} / {job.maxAttempts}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(job.updatedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {job.lastError && (
                              <button
                                onClick={() => toggleExpand(job.id)}
                                className="px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded transition-colors"
                              >
                                {isExpanded ? 'Hide Error' : 'View Error'}
                              </button>
                            )}
                            <Link
                              href={`/applications/${job.applicationId}`}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded transition-colors"
                            >
                              Review App →
                            </Link>
                          </div>

                          {/* Expanded Error Details */}
                          {isExpanded && job.lastError && (
                            <div className="mt-2 text-left p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-mono text-rose-800 whitespace-pre-wrap">
                              <div className="font-bold text-[11px] uppercase tracking-wider text-rose-900 mb-1">
                                Last Error Trace
                              </div>
                              {job.lastError}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </RoleGate>
  );
}
