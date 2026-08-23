'use client';

export default function LtvIndicator({ loanAmount, propertyValue }) {
  const loan = parseFloat(loanAmount);
  const property = parseFloat(propertyValue);

  if (!property || isNaN(property) || property <= 0) {
    return (
      <div className="text-xs text-slate-500 italic mt-1">
        Enter property value to calculate Loan-to-Value (LTV) ratio
      </div>
    );
  }

  if (!loan || isNaN(loan) || loan <= 0) {
    return (
      <div className="text-xs text-slate-500 italic mt-1">
        Enter loan amount to calculate LTV ratio
      </div>
    );
  }

  const ltv = (loan / property) * 100;
  const isWithinLimit = ltv <= 80;

  return (
    <div
      className={`mt-2 p-2.5 rounded-lg border text-xs font-medium flex items-center justify-between ${
        isWithinLimit
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : 'bg-rose-50 text-rose-800 border-rose-200'
      }`}
    >
      <div className="flex items-center gap-2">
        <span>{isWithinLimit ? '✅' : '⚠️'}</span>
        <span>
          LTV Ratio: <strong>{ltv.toFixed(1)}%</strong> ({isWithinLimit ? 'Compliant' : 'Exceeds 80% Max limit'})
        </span>
      </div>
      <span className="text-[11px] opacity-75">
        (₹{loan.toLocaleString('en-IN')} / ₹{property.toLocaleString('en-IN')})
      </span>
    </div>
  );
}
