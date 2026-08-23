'use client';

import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { RoleGate } from '../auth/RoleGate';
import { useManualRetry } from '../../hooks/useSyncJobs';

const CBS_CONFIG = {
  PENDING: {
    label: 'Sync Pending',
    icon: '⏳',
    className: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  IN_PROGRESS: {
    label: 'Syncing...',
    icon: '🔄',
    className: 'bg-sky-50 text-sky-700 border-sky-300 animate-pulse',
  },
  SUCCESS: {
    label: 'CBS Synced',
    icon: '✅',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  },
  FAILED: {
    label: 'Sync Failed',
    icon: '⚠️',
    className: 'bg-amber-50 text-amber-800 border-amber-300',
  },
  EXHAUSTED: {
    label: 'Sync Exhausted',
    icon: '🚨',
    className: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
  },
  NOT_APPLICABLE: {
    label: 'N/A',
    icon: '—',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
};

export default function CbsSyncBadge({
  status,
  syncJob = null,
  applicationId = null,
  onRetrySuccess = null,
  showDetail = false,
}) {
  const config = CBS_CONFIG[status] || CBS_CONFIG.PENDING;
  const user = useAuthStore((state) => state.user);
  const { retrySync, loading: retrying } = useManualRetry(applicationId);
  const [toastMessage, setToastMessage] = useState(null);

  const handleRetry = async (e) => {
    e.stopPropagation();
    if (!applicationId) return;

    const res = await retrySync();
    if (res.success) {
      setToastMessage(res.message || 'CBS sync re-triggered successfully');
      if (onRetrySuccess) onRetrySuccess();
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      setToastMessage(`Error: ${res.message}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const isFailedOrExhausted = ['FAILED', 'EXHAUSTED'].includes(status);

  return (
    <div className="inline-flex flex-col gap-1">
      <div className="inline-flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border font-medium ${config.className}`}
        >
          <span>{config.icon}</span>
          <span>{config.label}</span>
        </span>

        {/* Show attempt count when syncJob detail available */}
        {syncJob && isFailedOrExhausted && (
          <span className="text-[11px] text-slate-500 font-mono">
            ({syncJob.attempts}/{syncJob.maxAttempts} attempts)
          </span>
        )}

        {/* Show next retry timestamp for FAILED */}
        {syncJob?.nextRetryAt && status === 'FAILED' && (
          <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Next retry: {new Date(syncJob.nextRetryAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}

        {/* Manual Retry Button (ADMIN only) */}
        {applicationId && isFailedOrExhausted && (
          <RoleGate allowedRoles={['ADMIN']}>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
              title="Manually re-trigger CBS synchronization"
            >
              {retrying ? '🔄 Retrying...' : '↩ Retry Sync'}
            </button>
          </RoleGate>
        )}
      </div>

      {toastMessage && (
        <span className="text-[11px] font-medium text-slate-600 italic">
          {toastMessage}
        </span>
      )}

      {/* Collapsible Error View if showDetail is enabled */}
      {showDetail && syncJob?.lastError && (
        <details className="mt-1">
          <summary className="text-[11px] text-rose-600 hover:underline cursor-pointer font-medium">
            View CBS error log
          </summary>
          <div className="mt-1 p-2 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-800 font-mono whitespace-pre-wrap max-w-md">
            {syncJob.lastError}
          </div>
        </details>
      )}
    </div>
  );
}
