'use client';

const TYPE_CONFIG = {
  CIBIL_CHECK: {
    label: 'CIBIL Check',
    icon: '📊',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  DOCUMENT_VERIFICATION: {
    label: 'Doc Verification',
    icon: '📄',
    className: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  LEGAL_TITLE_SEARCH: {
    label: 'Legal Search',
    icon: '⚖️',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  PROPERTY_VALUATION: {
    label: 'Property Valuation',
    icon: '🏠',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  FINAL_REVIEW: {
    label: 'Final Review',
    icon: '✅',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  OTHER: {
    label: 'Custom Task',
    icon: '📌',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

export default function WorkItemTypeBadge({ type }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.OTHER;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${config.className}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
