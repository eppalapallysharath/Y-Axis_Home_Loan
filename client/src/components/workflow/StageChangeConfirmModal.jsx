'use client';

import { formatStageName } from '../../constants/workflow';

export default function StageChangeConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  fromStage,
  toStage,
  applicationId,
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">Confirm Stage Change</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to move loan application{' '}
            <strong className="text-slate-900">#{applicationId}</strong> from:
          </p>

          <div className="flex items-center justify-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800">
            <span className="px-2.5 py-1 rounded bg-white border border-slate-200">
              {formatStageName(fromStage)}
            </span>
            <span className="text-slate-400">➔</span>
            <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {formatStageName(toStage)}
            </span>
          </div>

          {(fromStage === 'COMPLETED' || fromStage === 'REJECTED') && (
            <p className="text-[11px] text-purple-800 bg-purple-50 p-2.5 rounded-lg border border-purple-200 font-medium">
              🔓 <strong>Reopening Application:</strong> As Admin/Manager, this will reopen the closed application and move it back to <strong>In Progress</strong> for active processing.
            </p>
          )}

          {toStage === 'UNDER_REVIEW' && (
            <p className="text-[11px] text-purple-700 bg-purple-50 p-2.5 rounded-lg border border-purple-200">
              ℹ️ Moving to Under Review signals that all verification checks are complete and the file is ready for underwriting review.
            </p>
          )}

          {toStage === 'COMPLETED' && (
            <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 font-medium">
              ✅ Approving this application will mark it as Completed and automatically queue CBS integration for loan sanctioning.
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-3.5 bg-slate-50/50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(toStage)}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Confirm & Move</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
