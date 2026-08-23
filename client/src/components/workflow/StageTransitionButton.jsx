'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ROLE_ALLOWED_TRANSITIONS,
  formatStageName,
} from '../../constants/workflow';
import StageChangeConfirmModal from './StageChangeConfirmModal';
import RejectModal from './RejectModal';

export default function StageTransitionButton({
  application,
  userRole,
  onTransition,
  loading = false,
  blockingError = null,
  onClearBlockingError,
}) {
  const [targetStage, setTargetStage] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  if (!application) return null;

  const currentStage = application.stage;
  const isTerminal = ['COMPLETED', 'REJECTED'].includes(currentStage);

  // Calculate next stages based on matrix & role
  const roleMatrix = ROLE_ALLOWED_TRANSITIONS[userRole] || ROLE_ALLOWED_TRANSITIONS.EXECUTIVE;
  const allowedStages = roleMatrix[currentStage] || [];

  const canReject = ['ADMIN', 'MANAGER'].includes(userRole) && !isTerminal;

  const handleStageSelect = (stage) => {
    setTargetStage(stage);
    setIsConfirmOpen(true);
  };

  const handleConfirmTransition = async (toStage) => {
    try {
      await onTransition({ toStage });
    } finally {
      setIsConfirmOpen(false);
      setTargetStage(null);
    }
  };

  const handleRejectSubmit = async (reason) => {
    const success = await onTransition({ toStage: 'REJECTED', rejectionReason: reason });
    if (success) {
      setIsRejectOpen(false);
    }
  };

  if (isTerminal) {
    const canReopen = ['ADMIN', 'MANAGER'].includes(userRole);

    return (
      <div className="space-y-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="text-base">{currentStage === 'COMPLETED' ? '✅' : '🔒'}</span>
            <span>
              This application is <strong>{formatStageName(currentStage)}</strong>.
              {canReopen
                ? ' As an Admin/Manager, you can reopen this application back to In Progress.'
                : ' Only an Admin or Manager can reopen this closed application.'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canReopen && (
              <button
                onClick={() => handleStageSelect('IN_PROGRESS')}
                disabled={loading}
                className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                    <span>Reopening...</span>
                  </>
                ) : (
                  <span>🔓 Reopen Application</span>
                )}
              </button>
            )}
            <Link
              href={`/applications/new?customerId=${application.customerId}`}
              className="font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 whitespace-nowrap"
            >
              Create new application →
            </Link>
          </div>
        </div>

        <StageChangeConfirmModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleConfirmTransition}
          fromStage={currentStage}
          toStage={targetStage}
          applicationId={application.id}
          loading={loading}
        />
      </div>
    );
  }

  if (!isTerminal && allowedStages.length === 0 && !canReject) {
    return (
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🟣</span>
          <span>
            This application is currently <strong>{formatStageName(currentStage)}</strong>. Final sanction or rework decision requires an Admin or Manager.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
          <span>Current Workflow Stage:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200">
            {formatStageName(currentStage)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Single Action Button */}
          {allowedStages.length === 1 && (
            <button
              onClick={() => handleStageSelect(allowedStages[0])}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Move to {formatStageName(allowedStages[0])}</span>
              )}
            </button>
          )}

          {/* Multiple Actions Dropdown */}
          {allowedStages.length > 1 && (
            <div className="relative inline-block text-left">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleStageSelect(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                disabled={loading}
                className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
              >
                <option value="" disabled className="text-slate-500">
                  Advance Stage...
                </option>
                {allowedStages.map((stageKey) => (
                  <option key={stageKey} value={stageKey} className="text-slate-900 font-medium">
                    Move to {formatStageName(stageKey)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Destructive Reject Button */}
          {canReject && (
            <button
              onClick={() => setIsRejectOpen(true)}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Reject Application
            </button>
          )}
        </div>
      </div>

      {/* Work Item Blocking Error Banner */}
      {blockingError && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <span>⚠️</span>
              <span>Cannot Advance Stage</span>
            </div>
            {onClearBlockingError && (
              <button
                onClick={onClearBlockingError}
                className="text-amber-500 hover:text-amber-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <p className="text-xs text-amber-800">{blockingError.message}</p>

          {blockingError.blockingItems && blockingError.blockingItems.length > 0 && (
            <div className="pt-2 border-t border-amber-200/60">
              <span className="text-[11px] font-bold text-amber-900 block mb-1">
                Blocking Work Items:
              </span>
              <ul className="space-y-1">
                {blockingError.blockingItems.map((item) => (
                  <li key={item.id} className="text-xs flex items-center justify-between bg-white/80 px-2.5 py-1.5 rounded border border-amber-200">
                    <span className="font-semibold text-slate-800">{item.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                      {item.status} ({item.type})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <StageChangeConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmTransition}
        fromStage={currentStage}
        toStage={targetStage}
        applicationId={application.id}
        loading={loading}
      />

      <RejectModal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onConfirm={handleRejectSubmit}
        applicationId={application.id}
        loading={loading}
      />
    </div>
  );
}
