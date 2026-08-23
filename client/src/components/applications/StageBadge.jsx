'use client';

const STAGE_CONFIG = {
  NEW: {
    label: 'New',
    className: 'bg-slate-100 text-slate-700 border-slate-300',
    dotColor: 'bg-slate-400',
  },
  WAITING_FOR_INFO: {
    label: 'Waiting for Info',
    className: 'bg-amber-50 text-amber-700 border-amber-300',
    dotColor: 'bg-amber-500',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-sky-50 text-sky-700 border-sky-300',
    dotColor: 'bg-sky-500',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    className: 'bg-purple-50 text-purple-700 border-purple-300',
    dotColor: 'bg-purple-500',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    dotColor: 'bg-emerald-500',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-rose-50 text-rose-700 border-rose-300',
    dotColor: 'bg-rose-500',
  },
};

export default function StageBadge({ stage }) {
  const config = STAGE_CONFIG[stage] || {
    label: stage || 'Unknown',
    className: 'bg-gray-100 text-gray-700 border-gray-300',
    dotColor: 'bg-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${config.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
}
