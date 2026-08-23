'use client';

const STAGES = [
  { key: 'NEW', label: 'New' },
  { key: 'WAITING_FOR_INFO', label: 'Waiting Info' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'COMPLETED', label: 'Completed' },
];

export default function StageProgressBar({ currentStage }) {
  const isRejected = currentStage === 'REJECTED';
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Workflow Stage Progress
        </span>
        {isRejected ? (
          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
            <span>✕</span>
            <span>REJECTED</span>
          </span>
        ) : currentStage === 'COMPLETED' ? (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
            <span>✓</span>
            <span>SANCTIONED & COMPLETED</span>
          </span>
        ) : null}
      </div>

      <div className="relative flex items-center justify-between w-full px-2">
        {/* Background connector line */}
        <div className="absolute top-3.5 left-6 right-6 -translate-y-1/2 h-1 bg-slate-200 -z-0 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{
              width: !isRejected && currentIndex >= 0
                ? `${(currentIndex / (STAGES.length - 1)) * 100}%`
                : '0%',
            }}
          />
        </div>

        {STAGES.map((stage, idx) => {
          const isCompletedStep = !isRejected && (idx < currentIndex || (currentStage === 'COMPLETED' && idx === currentIndex));
          const isCurrentStep = !isRejected && currentStage !== 'COMPLETED' && currentIndex === idx;

          let circleClass = 'bg-white border-2 border-slate-300 text-slate-400';
          let labelClass = 'text-slate-400 font-normal';

          if (isCompletedStep) {
            circleClass = 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-sm';
            labelClass = 'text-emerald-700 font-semibold';
          } else if (isCurrentStep) {
            circleClass = 'bg-white border-4 border-blue-600 text-blue-600 font-bold ring-4 ring-blue-100 shadow-sm';
            labelClass = 'text-blue-900 font-bold';
          }

          return (
            <div key={stage.key} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all duration-200 ${circleClass}`}
              >
                {isCompletedStep ? '✓' : idx + 1}
              </div>
              <span className={`text-[11px] mt-1.5 whitespace-nowrap ${labelClass}`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

