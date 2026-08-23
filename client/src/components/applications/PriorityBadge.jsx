'use client';

const PRIORITY_CONFIG = {
  LOW: {
    label: 'LOW',
    icon: '⚪',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  MEDIUM: {
    label: 'MEDIUM',
    icon: '🔵',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  HIGH: {
    label: 'HIGH',
    icon: '🟠',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  URGENT: {
    label: 'URGENT',
    icon: '🔴',
    className: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse font-semibold',
  },
};

export default function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || {
    label: priority || 'MEDIUM',
    icon: '🔵',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border ${config.className}`}
    >
      <span className="text-[10px]">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
