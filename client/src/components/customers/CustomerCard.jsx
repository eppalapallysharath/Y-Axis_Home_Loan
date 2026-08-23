'use client';

import Link from 'next/link';
import { User, Phone, Mail, CreditCard, Briefcase, FileText, ArrowRight } from 'lucide-react';
import { CreditScoreBadge } from './CreditScoreBadge';

export function CustomerCard({ customer }) {
  if (!customer) return null;

  const appCount = customer._count?.applications ?? customer.applications?.length ?? 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100">
            {customer.fullName ? customer.fullName.slice(0, 2).toUpperCase() : 'CU'}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-base">{customer.fullName}</h3>
            <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              PAN: <span className="font-bold text-slate-700">{customer.panNumber}</span>
            </p>
          </div>
        </div>
        <CreditScoreBadge score={customer.creditScore} showLabel={false} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 truncate">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>{customer.phone}</span>
        </div>
        <div className="flex items-center gap-2 truncate">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span>{customer.email}</span>
        </div>
        <div className="flex items-center gap-2 truncate">
          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
          <span className="capitalize">{customer.employmentType ? customer.employmentType.replace('_', ' ').toLowerCase() : 'Salaried'}</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-700">{appCount} Application(s)</span>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <Link
          href={`/customers/${customer.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View Profile <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
