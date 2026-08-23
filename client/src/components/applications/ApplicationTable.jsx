'use client';

import Link from 'next/link';
import StageBadge from './StageBadge';
import PriorityBadge from './PriorityBadge';
import CbsSyncBadge from './CbsSyncBadge';
import { useAuth } from '../../redux/hooks';

export default function ApplicationTable({
  applications,
  loading,
  pagination,
  onPageChange,
}) {
  const { user } = useAuth();
  const canSeeCbs = user && (user.role === 'ADMIN' || user.role === 'MANAGER');

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mb-2" />
        <p>Loading loan applications...</p>
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">
          📂
        </div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">No Loan Applications Found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          No loan applications match your current scope or search filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">App ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Loan Type</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Stage</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Assigned To</th>
              {canSeeCbs && <th className="py-3 px-4">CBS Sync</th>}
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                  <Link href={`/applications/${app.id}`} className="hover:underline">
                    #{app.id}
                  </Link>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900">{app.customer?.fullName}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {app.customer?.panNumber}
                  </div>
                </td>
                <td className="py-3.5 px-4 font-medium text-slate-600">
                  {app.applicationType === 'HOME_LOAN'
                    ? 'Home Loan'
                    : app.applicationType === 'TOP_UP'
                    ? 'Top-Up Loan'
                    : app.applicationType === 'LAP'
                    ? 'Loan Against Property'
                    : app.applicationType}
                </td>
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  ₹{Number(app.loanAmount || 0).toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 px-4">
                  <StageBadge stage={app.stage} />
                </td>
                <td className="py-3.5 px-4">
                  <PriorityBadge priority={app.priority} />
                </td>
                <td className="py-3.5 px-4">
                  {app.assignedTo ? (
                    <span className="font-medium text-slate-800">{app.assignedTo.name}</span>
                  ) : (
                    <span className="text-slate-400 italic">— Unassigned</span>
                  )}
                </td>
                {canSeeCbs && (
                  <td className="py-3.5 px-4">
                    <CbsSyncBadge status={app.cbsSyncStatus} />
                  </td>
                )}
                <td className="py-3.5 px-4 text-right">
                  <Link
                    href={`/applications/${app.id}`}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                  >
                    Review →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
          <div>
            Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total items)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
