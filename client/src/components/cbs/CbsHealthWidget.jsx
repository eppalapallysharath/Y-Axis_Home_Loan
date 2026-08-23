'use client';

import Link from 'next/link';
import { useSyncJobStats } from '../../hooks/useSyncJobs';
import { CheckCircle2, Clock, AlertTriangle, AlertOctagon, RefreshCw, ArrowRight } from 'lucide-react';

export default function CbsHealthWidget() {
  const { stats, loading, refetch } = useSyncJobStats();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-sm">
            🏦
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">CBS Integration Health</h3>
            <p className="text-[11px] text-slate-500">Core Banking System Synchronization Monitor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/admin/sync-jobs"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            <span>View All Jobs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {loading && stats.total === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">Loading CBS health metrics...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Synced */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Synced</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-emerald-900">{stats.success}</div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Ingested by CBS</div>
          </div>

          {/* Pending */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Pending</span>
              <Clock className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-xl font-bold text-slate-900">{stats.pending}</div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">Awaiting initial sync</div>
          </div>

          {/* Syncing */}
          <div className="p-3 bg-sky-50/60 border border-sky-200/80 rounded-xl">
            <div className="flex items-center justify-between text-sky-700 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Syncing</span>
              <RefreshCw className="w-4 h-4 text-sky-600 animate-spin" />
            </div>
            <div className="text-xl font-bold text-sky-900">{stats.inProgress}</div>
            <div className="text-[10px] text-sky-600 font-medium mt-0.5">In flight</div>
          </div>

          {/* Failed */}
          <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl">
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Failed</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-bold text-amber-900">{stats.failed}</div>
            <div className="text-[10px] text-amber-600 font-medium mt-0.5">Retries scheduled</div>
          </div>

          {/* Exhausted */}
          <div className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-xl">
            <div className="flex items-center justify-between text-rose-700 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Exhausted</span>
              <AlertOctagon className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl font-bold text-rose-900">{stats.exhausted}</div>
            <div className="text-[10px] text-rose-600 font-medium mt-0.5">Manual retry needed</div>
          </div>
        </div>
      )}
    </div>
  );
}
