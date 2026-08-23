'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  CreditCard,
  Phone,
  Mail,
  Briefcase,
  Calendar,
  MapPin,
  Plus,
  FileText,
  ShieldCheck,
  Building2,
  Clock,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useCustomer } from '../../../hooks/useCustomers';
import { CreditScoreBadge } from '../../../components/customers/CreditScoreBadge';

export default function CustomerDetailPage({ params }) {
  const unwrappedParams = use(params);
  const customerId = unwrappedParams.id;
  const router = useRouter();

  const { user, isLoading: authLoading } = useAuthStore();
  const { customer, loading, error } = useCustomer(customerId);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-pulse flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="text-sm font-medium">Loading applicant profile...</span>
        </div>
      </div>
    );
  }

  // Mask Aadhaar helper (shows only last 4 digits)
  const maskAadhaar = (aadhaar) => {
    if (!aadhaar) return 'Not Provided';
    const digits = String(aadhaar).replace(/\D/g, '');
    if (digits.length < 4) return 'XXXX XXXX XXXX';
    return `XXXX XXXX ${digits.slice(-4)}`;
  };

  // Format currency helper
  const formatINR = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStageBadgeStyle = (stage) => {
    switch (stage) {
      case 'NEW':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'WAITING_FOR_INFO':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'IN_PROGRESS':
        return 'bg-sky-50 text-sky-700 border-sky-300';
      case 'UNDER_REVIEW':
        return 'bg-purple-50 text-purple-700 border-purple-300';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/customers" className="hover:text-blue-600 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Customers
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-800">
              {loading ? 'Loading...' : customer?.fullName || `Applicant #${customerId}`}
            </span>
          </div>

          {/* Error handling */}
          {error && (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-base">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>Error Accessing Customer</span>
              </div>
              <p className="text-xs">{error}</p>
              <Link href="/customers" className="inline-block mt-2 text-xs font-bold text-blue-600 hover:underline">
                ← Back to Customers List
              </Link>
            </div>
          )}

          {!loading && customer && (
            <>
              {/* Profile Card Header */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
                      {customer.fullName ? customer.fullName.slice(0, 2).toUpperCase() : 'CU'}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900">{customer.fullName}</h1>
                        <CreditScoreBadge score={customer.creditScore} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span>PAN: <strong className="font-mono text-slate-800">{customer.panNumber}</strong></span>
                        <span>•</span>
                        <span>Aadhaar: <strong className="font-mono text-slate-800">{maskAadhaar(customer.aadhaarNumber)}</strong></span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/applications/new?customerId=${customer.id}`}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Loan Application</span>
                    </Link>
                  </div>
                </div>

                {/* Personal & Financial Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Contact Phone</span>
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-500" />
                      {customer.phone}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Email Address</span>
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      {customer.email}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Employment Profile</span>
                    <p className="font-semibold text-slate-900 capitalize flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-purple-500" />
                      {customer.employmentType ? customer.employmentType.replace('_', ' ').toLowerCase() : 'Salaried'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Declared Annual Income</span>
                    <p className="font-semibold text-slate-900">
                      {customer.annualIncome ? `${formatINR(customer.annualIncome)} / yr` : 'Not Specified'}
                    </p>
                  </div>

                  {customer.dateOfBirth && (
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Date of Birth</span>
                      <p className="font-medium text-slate-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(customer.dateOfBirth).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}

                  {customer.address && (
                    <div className="space-y-1 md:col-span-2">
                      <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Residential Address</span>
                      <p className="font-medium text-slate-700 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span>{customer.address}</span>
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Registration Audit</span>
                    <p className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Registered by <strong className="text-slate-700">{customer.createdBy?.name || 'Staff'}</strong> on{' '}
                      {new Date(customer.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Loan Applications Section */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">
                      Associated Loan Applications ({customer.applications?.length || 0})
                    </h2>
                  </div>

                  <Link
                    href={`/applications/new?customerId=${customer.id}`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    + Create Application for Customer
                  </Link>
                </div>

                {!customer.applications || customer.applications.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-sm font-semibold text-slate-700">No Loan Applications Created Yet</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      This customer has no active loan applications under your authorized view. Click below to start an application.
                    </p>
                    <div className="mt-4">
                      <Link
                        href={`/applications/new?customerId=${customer.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                      >
                        + Create Loan Application
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4">App ID</th>
                          <th className="py-3 px-4">Loan Type</th>
                          <th className="py-3 px-4">Requested Amount</th>
                          <th className="py-3 px-4">Workflow Stage</th>
                          <th className="py-3 px-4">Assigned To</th>
                          <th className="py-3 px-4">Created Date</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {customer.applications.map((app) => (
                          <tr
                            key={app.id}
                            onClick={() => router.push(`/applications/${app.id}`)}
                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-4 font-mono font-bold text-blue-600">
                              #{String(app.id).padStart(4, '0')}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900 capitalize">
                              {app.applicationType ? app.applicationType.replace('_', ' ') : 'Home Loan'}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800">
                              {formatINR(app.loanAmount)}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full font-semibold border text-[11px] ${getStageBadgeStyle(app.stage)}`}>
                                {app.stage ? app.stage.replace('_', ' ') : 'NEW'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {app.assignedTo?.name || 'Unassigned'}
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {new Date(app.createdAt).toLocaleDateString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Link
                                href={`/applications/${app.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline"
                              >
                                Review <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
    </div>
  );
}
