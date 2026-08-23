'use client';

import {
  getActivityDescription,
  getActivityBadgeProps,
  formatRelativeTime,
} from '../../lib/activityDescriptions';

export default function ActivityEntry({ log }) {
  if (!log) return null;

  const description = getActivityDescription(log);
  const badgeProps = getActivityBadgeProps(log.action);
  const isNote = log.action === 'NOTE_ADDED';
  const isSystemEvent = log.action.startsWith('CBS_');
  const actorName = log.user?.name || 'System';
  const actorRole = log.user?.role
    ? log.user.role === 'ADMIN'
      ? 'Admin'
      : log.user.role === 'MANAGER'
      ? 'Branch Manager'
      : 'Loan Officer'
    : '';

  return (
    <div className="relative flex gap-3 pl-8 pb-5 group">
      {/* Timeline colored dot */}
      <div
        className={`absolute left-0 top-1 w-3 h-3 rounded-full ring-4 ring-white ${badgeProps.dotColor} shadow-sm transition-transform group-hover:scale-110`}
      />

      <div className="flex-1 space-y-1">
        {/* Header line: Description + Badge + Timestamp */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center flex-wrap gap-1.5">
            {/* Category Badge */}
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeProps.badgeBg}`}
            >
              {badgeProps.label}
            </span>

            {/* Description Text */}
            <span
              className={`text-xs ${
                isSystemEvent
                  ? 'text-slate-600 italic font-medium'
                  : 'text-slate-900 font-semibold'
              }`}
            >
              {description}
            </span>
          </div>

          {/* Relative Timestamp */}
          <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap shrink-0">
            {formatRelativeTime(log.createdAt)}
          </span>
        </div>

        {/* Note Card Body */}
        {isNote && log.metadata?.noteText && (
          <div className="mt-1.5 p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-slate-800 shadow-xs font-sans leading-relaxed">
            "{log.metadata.noteText}"
          </div>
        )}

        {/* Extra Rejection Reason Card if present in stage change metadata */}
        {log.metadata?.rejectionReason && !isNote && (
          <div className="mt-1.5 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-medium italic">
            Reason: "{log.metadata.rejectionReason}"
          </div>
        )}

        {/* Actor Info */}
        {!isSystemEvent && (
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 pt-0.5">
            <span>👤 {actorName}</span>
            {actorRole && (
              <>
                <span>·</span>
                <span className="text-slate-500">{actorRole}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
