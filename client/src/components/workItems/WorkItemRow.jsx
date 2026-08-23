'use client';

import { useState } from 'react';
import WorkItemTypeBadge from './WorkItemTypeBadge';
import { useAuth } from '../../redux/hooks';

const STATUS_CONFIG = {
  COMPLETED: {
    icon: '✅',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    label: 'COMPLETED',
  },
  IN_PROGRESS: {
    icon: '⏳',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-300',
    label: 'IN_PROGRESS',
  },
  BLOCKED: {
    icon: '❌',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-300',
    label: 'BLOCKED',
  },
  OPEN: {
    icon: '⬜',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    label: 'OPEN',
  },
};

export default function WorkItemRow({
  item,
  application,
  onUpdateStatus,
  onDelete,
  updating,
  deleting,
}) {
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth();

  const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.OPEN;

  // Authorization checks
  const isAdminOrManager = user && (user.role === 'ADMIN' || user.role === 'MANAGER');
  const isWorkItemAssignee = user && item.assignedToId === user.id;
  const isAppAssignee = user && application && application.assignedToId === user.id;
  const canUpdateStatus = isAdminOrManager || isWorkItemAssignee || isAppAssignee;
  const canDelete = isAdminOrManager && item.status === 'OPEN';

  return (
    <div className="py-3 px-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Left Side: Icon, Type Badge, Title, Assignee */}
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="text-base select-none mt-0.5" title={item.status}>
            {statusConfig.icon}
          </span>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <WorkItemTypeBadge type={item.type} />
              <span className="font-bold text-slate-900 text-sm truncate">{item.title}</span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span>
                👤 Assigned: <strong className="text-slate-700">{item.assignedTo?.name || 'Unassigned'}</strong>
              </span>
              <span>•</span>
              <span>
                {item.status === 'COMPLETED' && item.completedAt ? (
                  <span className="text-emerald-700 font-medium">
                    Completed {new Date(item.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                ) : (
                  <span>Created {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Status Badge & Contextual Actions */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <span
            className={`px-2 py-0.5 rounded border text-[10px] font-bold tracking-wider uppercase ${statusConfig.badgeClass}`}
          >
            {statusConfig.label}
          </span>

          {/* Action Buttons based on status & permissions */}
          {item.status !== 'COMPLETED' && canUpdateStatus && (
            <div className="flex items-center gap-1.5 ml-2">
              {item.status === 'OPEN' && (
                <>
                  <button
                    onClick={() => onUpdateStatus(item.id, 'IN_PROGRESS')}
                    disabled={updating}
                    className="px-2.5 py-1 text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    ▶ Start
                  </button>
                  <button
                    onClick={() => onUpdateStatus(item.id, 'COMPLETED')}
                    disabled={updating}
                    className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    ✓ Complete
                  </button>
                </>
              )}

              {item.status === 'IN_PROGRESS' && (
                <>
                  <button
                    onClick={() => onUpdateStatus(item.id, 'COMPLETED')}
                    disabled={updating}
                    className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    ✓ Mark Complete
                  </button>
                  <button
                    onClick={() => onUpdateStatus(item.id, 'BLOCKED')}
                    disabled={updating}
                    className="px-2.5 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    ⚠️ Mark Blocked
                  </button>
                </>
              )}

              {item.status === 'BLOCKED' && (
                <button
                  onClick={() => onUpdateStatus(item.id, 'IN_PROGRESS')}
                  disabled={updating}
                  className="px-2.5 py-1 text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  ▶ Resume
                </button>
              )}
            </div>
          )}

          {/* Delete Button for OPEN items (ADMIN/MANAGER) */}
          {canDelete && (
            <button
              onClick={() => onDelete(item.id)}
              disabled={deleting}
              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors text-xs ml-1"
              title="Delete Open Work Item"
            >
              🗑️
            </button>
          )}

          {/* Expand description toggle */}
          {item.description && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-blue-600 hover:underline font-medium ml-1"
            >
              {expanded ? 'Hide Details' : 'Details'}
            </button>
          )}
        </div>
      </div>

      {/* Expandable Description */}
      {expanded && item.description && (
        <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg italic">
          {item.description}
        </div>
      )}
    </div>
  );
}
