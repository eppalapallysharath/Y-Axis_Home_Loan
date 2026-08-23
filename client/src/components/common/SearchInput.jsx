'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

/**
 * Reusable debounced search input component
 */
export function SearchInput({ value = '', onChange, placeholder = 'Search...' }) {
  const [localValue, setLocalValue] = useState(value || '');
  const debouncedValue = useDebounce(localValue, 300);

  // Notify parent of debounced change
  useEffect(() => {
    if (debouncedValue !== (value || '')) {
      onChange(debouncedValue || undefined);
    }
  }, [debouncedValue, value, onChange]);

  // Sync with external state changes (e.g. clear filters button)
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleClear = () => {
    setLocalValue('');
    onChange(undefined);
  };

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-lg pl-9 pr-8 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition-colors"
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
