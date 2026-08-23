'use client';

import { ShieldCheck, ShieldAlert } from 'lucide-react';

export function CreditScoreBadge({ score, showLabel = true }) {
  if (score === null || score === undefined || score === '') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
        Score Pending
      </span>
    );
  }

  const scoreNum = Number(score);
  let colorStyle = '';
  let label = '';
  let Icon = ShieldCheck;

  if (scoreNum < 650) {
    colorStyle = 'bg-rose-50 text-rose-700 border-rose-200';
    label = 'Poor / High Risk';
    Icon = ShieldAlert;
  } else if (scoreNum <= 749) {
    colorStyle = 'bg-amber-50 text-amber-700 border-amber-200';
    label = 'Moderate Risk';
    Icon = ShieldCheck;
  } else {
    colorStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    label = 'Good Credit';
    Icon = ShieldCheck;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${colorStyle}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{scoreNum} CIBIL</span>
      {showLabel && <span className="opacity-75 font-normal">({label})</span>}
    </span>
  );
}
