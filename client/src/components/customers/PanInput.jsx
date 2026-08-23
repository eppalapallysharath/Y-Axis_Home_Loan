'use client';

import { useState } from 'react';
import { CreditCard, AlertCircle, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../lib/api';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export function PanInput({ value, onChange, error: externalError, required = true }) {
  const [checking, setChecking] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState(null);
  const [formatError, setFormatError] = useState('');

  const handleChange = (e) => {
    const rawVal = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    onChange(rawVal);
    setFormatError('');
    setExistingCustomer(null);
  };

  const handleBlur = async () => {
    if (!value) return;

    if (!PAN_REGEX.test(value)) {
      setFormatError('Format should be 5 letters, 4 numbers, 1 letter (e.g. ABCDE1234F)');
      return;
    }

    setChecking(true);
    try {
      const res = await api.get(`/customers?search=${encodeURIComponent(value)}`);
      const matched = res.data?.find(
        (c) => c.panNumber.toUpperCase() === value.toUpperCase()
      );
      if (matched) {
        setExistingCustomer(matched);
      }
    } catch (err) {
      console.error('PAN check error:', err);
    } finally {
      setChecking(false);
    }
  };

  const isValidFormat = PAN_REGEX.test(value);
  const displayError = externalError || formatError;

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
        PAN Number {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <CreditCard className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={10}
          placeholder="ABCDE1234F"
          className={`w-full pl-9 pr-10 py-2 bg-white border ${
            existingCustomer || displayError
              ? 'border-rose-400 focus:ring-rose-200'
              : isValidFormat
              ? 'border-emerald-400 focus:ring-emerald-200'
              : 'border-slate-300 focus:ring-blue-100'
          } rounded-lg text-sm font-mono tracking-widest uppercase text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all`}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {checking && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
          {!checking && existingCustomer && <AlertCircle className="w-4 h-4 text-rose-500" />}
          {!checking && !existingCustomer && isValidFormat && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          )}
        </div>
      </div>

      {/* Duplicate PAN warning banner */}
      {existingCustomer && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">Customer with this PAN already exists:</span>{' '}
            {existingCustomer.fullName} ({existingCustomer.phone})
          </div>
          <Link
            href={`/customers/${existingCustomer.id}`}
            className="font-semibold text-blue-600 hover:text-blue-800 underline flex items-center gap-1 flex-shrink-0"
          >
            View Customer <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Error message */}
      {!existingCustomer && displayError && (
        <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {displayError}
        </p>
      )}
    </div>
  );
}
