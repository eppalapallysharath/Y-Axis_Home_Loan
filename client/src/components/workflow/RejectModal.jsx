'use client';

import { useState } from 'react';

export default function RejectModal({
  isOpen,
  onClose,
  onConfirm,
  applicationId,
  loading = false,
}) {
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setValidationError('Please state a reason for rejecting this loan application.');
      return;
    }
    if (reason.length > 500) {
      setValidationError('Rejection reason cannot exceed 500 characters.');
      return;
    }

    setValidationError('');
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 bg-rose-50/50">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <h3 className="text-sm font-bold text-rose-900">
              Reject Application #{applicationId}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-medium">
              🚨 <strong>Caution:</strong> Application rejection is a terminal decision. Once rejected, this application cannot be reopened.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (validationError) setValidationError('');
                }}
                placeholder="e.g. CIBIL credit score below minimum policy threshold (650), unverified employment records."
                className={`w-full text-xs text-slate-900 placeholder:text-slate-400 font-medium border rounded-lg p-2.5 bg-white outline-none focus:ring-2 ${
                  validationError
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
              />
              {validationError ? (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{validationError}</p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">
                  Maximum 500 characters. Stored in activity history.
                </p>
              )}
            </div>
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
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                  <span>Rejecting...</span>
                </>
              ) : (
                <span>Reject Application</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
