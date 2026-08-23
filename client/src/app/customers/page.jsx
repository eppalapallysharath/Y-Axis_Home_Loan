'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Users, Phone, Mail, Loader2, FileText, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../redux/hooks';
import { useCustomers } from '../../hooks/useCustomers';
import { useCustomerFilters } from '../../hooks/useCustomerFilters';
import { CustomerSearchBar } from '../../components/customers/CustomerSearchBar';
import { CreditScoreBadge } from '../../components/customers/CreditScoreBadge';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState } from '../../components/common/EmptyState';

function CustomersContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { filters, setFilter, clearFilters, hasActiveFilters } = useCustomerFilters();
  const { customers, pagination, loading, error } = useCustomers(filters);

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
          <span className="text-sm font-medium">Loading workspace session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Management</h1>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Browse, search, and register loan applicants across your scope
              </p>
            </div>

            <Link
              href="/customers/new"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Customer</span>
            </Link>
          </div>

          {/* Search & Filter Bar */}
          <CustomerSearchBar
            filters={filters}
            onFilterChange={setFilter}
            onClearFilters={clearFilters}
          />

          {/* Error Alert */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
              Failed to load customers: {error}
            </div>
          )}

          {/* Data Table Container */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-medium text-slate-600">Fetching customer profiles...</p>
            </div>
          ) : customers.length === 0 ? (
            <EmptyState
              hasFilters={hasActiveFilters}
              onClearFilters={clearFilters}
              title={hasActiveFilters ? 'No Customers Match Filters' : 'No Customers Found'}
              message={
                hasActiveFilters
                  ? 'No customer records match your filter criteria. Try broadening search terms or date ranges.'
                  : 'No customer profiles have been registered yet. Click "New Customer" to register an applicant.'
              }
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Applicant Name</th>
                      <th className="py-3.5 px-4">PAN Number</th>
                      <th className="py-3.5 px-4">Contact Info</th>
                      <th className="py-3.5 px-4">Employment</th>
                      <th className="py-3.5 px-4">CIBIL Score</th>
                      <th className="py-3.5 px-4">Applications</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {customers.map((customer) => {
                      const appCount = customer._count?.applications ?? customer.applications?.length ?? 0;
                      return (
                        <tr
                          key={customer.id}
                          onClick={() => router.push(`/customers/${customer.id}`)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">
                                {customer.fullName ? customer.fullName.slice(0, 2).toUpperCase() : 'CU'}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                  {customer.fullName}
                                </p>
                                <p className="text-xs text-slate-400">
                                  Registered by {customer.createdBy?.name || 'User'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-700">
                            {customer.panNumber}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5 text-xs text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{customer.phone}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-[160px]">{customer.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-medium text-slate-700 capitalize">
                            {customer.employmentType ? customer.employmentType.replace('_', ' ').toLowerCase() : 'Salaried'}
                          </td>
                          <td className="py-3.5 px-4">
                            <CreditScoreBadge score={customer.creditScore} showLabel={false} />
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                appCount > 0
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              <FileText className="w-3 h-3" />
                              {appCount} {appCount === 1 ? 'app' : 'apps'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              href={`/customers/${customer.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              View <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <Pagination
                total={pagination.total}
                page={pagination.page}
                limit={pagination.limit}
                totalPages={pagination.totalPages}
                onPageChange={(page) => setFilter({ page })}
              />
            </div>
          )}
    </div>
  );
}

export default function CustomersListPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading page...</div>}>
      <CustomersContent />
    </Suspense>
  );
}
