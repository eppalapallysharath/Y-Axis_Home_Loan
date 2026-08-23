'use client';

import { X } from 'lucide-react';

/**
 * Chip-style multi-select filter component
 * @param {Object} props
 * @param {string} props.label - Filter label
 * @param {Array<{ value: string, label: string }>} props.options - Selectable options
 * @param {string|Array<string>} [props.selected] - Currently selected values (comma-separated string or array)
 * @param {Function} props.onChange - Callback triggered with updated comma-separated string or undefined
 */
export function MultiSelectFilter({ label, options = [], selected = '', onChange }) {
  const selectedArray = Array.isArray(selected)
    ? selected
    : selected
    ? String(selected).split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const toggleOption = (val) => {
    let next;
    if (selectedArray.includes(val)) {
      next = selectedArray.filter((v) => v !== val);
    } else {
      next = [...selectedArray, val];
    }
    const result = next.length > 0 ? next.join(',') : undefined;
    onChange(result);
  };

  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isSelected = selectedArray.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleOption(opt.value)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              <span>{opt.label}</span>
              {isSelected && <X className="w-3 h-3 ml-0.5 opacity-80" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
