'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '../../../lib/api';
import { useCreateApplication } from '../../../hooks/useApplications';
import LtvIndicator from '../../../components/applications/LtvIndicator';

function CreateApplicationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledCustomerId = searchParams.get('customerId');

  const { createApplication, loading: submitting } = useCreateApplication();

  // Customer search & selection state
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form fields
  const [applicationType, setApplicationType] = useState('HOME_LOAN');
  const [loanAmount, setLoanAmount] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyValue, setPropertyValue] = useState('');
  const [remarks, setRemarks] = useState('');

  const [formError, setFormError] = useState(null);

  // Fetch pre-filled customer details if customerId is present in query param
  useEffect(() => {
    if (prefilledCustomerId) {
      fetchCustomerById(prefilledCustomerId);
    }
  }, [prefilledCustomerId]);

  const fetchCustomerById = async (id) => {
    try {
      const res = await api.get(`/customers/${id}`);
      if (res.data) {
        setSelectedCustomer(res.data);
      }
    } catch (err) {
      console.error('Error fetching prefilled customer:', err);
    }
  };

  // Search customers as user types
  const handleCustomerSearch = async (term) => {
    setCustomerSearch(term);
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchingCustomer(true);
    try {
      const res = await api.get(`/customers?search=${encodeURIComponent(term)}&limit=5`);
      setSearchResults(res.data || []);
    } catch (err) {
      console.error('Customer search error:', err);
    } finally {
      setSearchingCustomer(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedCustomer) {
      const msg = 'Please select a customer for this loan application.';
      setFormError(msg);
      toast.error(msg);
      return;
    }

    const amount = parseFloat(loanAmount);
    if (!loanAmount || isNaN(amount) || amount <= 0) {
      const msg = 'Please enter a valid loan amount.';
      setFormError(msg);
      toast.error(msg);
      return;
    }

    if (amount < 100000) {
      const msg = 'Minimum loan amount is ₹1,00,000 (1 Lakh).';
      setFormError(msg);
      toast.error(msg);
      return;
    }

    if (amount > 100000000) {
      const msg = 'Maximum loan amount is ₹10,00,00,000 (10 Crore).';
      setFormError(msg);
      toast.error(msg);
      return;
    }

    const propVal = propertyValue ? parseFloat(propertyValue) : null;
    if (propVal && amount) {
      const ltv = (amount / propVal) * 100;
      if (ltv > 80) {
        const msg = `Loan amount exceeds 80% LTV limit (${ltv.toFixed(1)}%). Maximum allowed is 80%.`;
        setFormError(msg);
        toast.error(msg);
        return;
      }
    }

    const payload = {
      customerId: selectedCustomer.id,
      applicationType,
      loanAmount: amount,
      priority,
      propertyAddress: propertyAddress || undefined,
      propertyValue: propVal || undefined,
      remarks: remarks || undefined,
    };

    const res = await createApplication(payload);

    if (res.success && res.data) {
      toast.success('Loan application created successfully! 🎉');
      router.push(`/applications/${res.data.id}`);
    } else {
      const errMsg = res.message || 'Failed to create loan application.';
      setFormError(errMsg);
      toast.error(errMsg);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb & Header */}
      <div>
        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
          <Link href="/applications" className="hover:text-blue-600">
            Applications
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">New Application</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Loan Application</h1>
        <p className="text-xs text-slate-500 mt-1">
          Link a customer and set up the loan application parameters.
        </p>
      </div>

      {formError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Customer Selection */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            1. Applicant (Customer)
          </h2>

          {selectedCustomer ? (
            <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
              <div>
                <div className="text-sm font-bold text-slate-900">{selectedCustomer.fullName}</div>
                <div className="text-xs text-slate-600 flex items-center gap-3 mt-0.5">
                  <span>PAN: <strong className="font-mono">{selectedCustomer.panNumber}</strong></span>
                  <span>Phone: {selectedCustomer.phone}</span>
                  <span>Income: ₹{Number(selectedCustomer.annualIncome || 0).toLocaleString('en-IN')}/yr</span>
                </div>
              </div>
              {!prefilledCustomerId && (
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-white px-3 py-1 rounded-md border border-blue-200 shadow-xs"
                >
                  Change
                </button>
              )}
            </div>
          ) : (
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Search Customer by Name or PAN *
              </label>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => handleCustomerSearch(e.target.value)}
                placeholder="Type customer name or PAN..."
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {searchingCustomer && (
                <div className="text-xs text-slate-400 mt-1">Searching customers...</div>
              )}
              {searchResults.length > 0 && (
                <ul className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((cust) => (
                    <li
                      key={cust.id}
                      onClick={() => {
                        setSelectedCustomer(cust);
                        setSearchResults([]);
                        setCustomerSearch('');
                      }}
                      className="p-3 hover:bg-blue-50 cursor-pointer text-xs transition-colors"
                    >
                      <div className="font-semibold text-slate-900">{cust.fullName}</div>
                      <div className="text-slate-500 text-[11px] flex gap-2">
                        <span>PAN: {cust.panNumber}</span>
                        <span>• Phone: {cust.phone}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {customerSearch.length >= 2 && searchResults.length === 0 && !searchingCustomer && (
                <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                  No matching customer found. Make sure the customer is created in Customer Management module first.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Application Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            2. Loan Application Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Loan Type *
              </label>
              <select
                value={applicationType}
                onChange={(e) => setApplicationType(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="HOME_LOAN">Home Loan</option>
                <option value="TOP_UP">Top-Up Loan</option>
                <option value="LAP">Loan Against Property (LAP)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Priority Level *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority (Default)</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent Escalation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Loan Amount (INR) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">₹</span>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="e.g. 5000000 (Min ₹1L - Max ₹10Cr)"
                className="w-full text-xs border border-slate-300 rounded-lg pl-7 pr-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-900"
              />
            </div>
            {loanAmount && !isNaN(parseFloat(loanAmount)) && (
              <div className="text-[11px] text-blue-600 font-medium mt-1">
                = ₹{parseFloat(loanAmount).toLocaleString('en-IN')}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Remarks / Notes
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add initial notes or comments about this application..."
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Section 3: Property Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            3. Collateral Property Details (Optional)
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Property Address
            </label>
            <input
              type="text"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              placeholder="e.g. Flat 402, Sunshine Heights, Jubilee Hills, Hyderabad"
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Estimated Property Value (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">₹</span>
              <input
                type="number"
                value={propertyValue}
                onChange={(e) => setPropertyValue(e.target.value)}
                placeholder="e.g. 7500000"
                className="w-full text-xs border border-slate-300 rounded-lg pl-7 pr-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-900"
              />
            </div>
            {propertyValue && !isNaN(parseFloat(propertyValue)) && (
              <div className="text-[11px] text-slate-600 font-medium mt-1">
                = ₹{parseFloat(propertyValue).toLocaleString('en-IN')}
              </div>
            )}
          </div>

          {/* Real-Time LTV Indicator */}
          <LtvIndicator loanAmount={loanAmount} propertyValue={propertyValue} />
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/applications"
            className="px-5 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !selectedCustomer || !loanAmount}
            className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {submitting ? 'Creating Application...' : 'Create Application →'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreateApplicationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading form...</div>}>
      <CreateApplicationContent />
    </Suspense>
  );
}
