'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, User, CreditCard, Briefcase, Calendar, MapPin, DollarSign, ShieldCheck, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useCreateCustomer } from '../../../hooks/useCustomers';
import { PanInput } from '../../../components/customers/PanInput';

export default function CreateCustomerPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { createCustomer, loading, error: submitError } = useCreateCustomer();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    panNumber: '',
    aadhaarNumber: '',
    dateOfBirth: '',
    address: '',
    employmentType: 'SALARIED',
    annualIncome: '',
    creditScore: '',
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [duplicateConflict, setDuplicateConflict] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setValidationErrors((prev) => ({ ...prev, [field]: '' }));
    setDuplicateConflict(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.panNumber.trim()) errors.panNumber = 'PAN number is required';

    if (formData.phone && !/^\d{10}$/.test(formData.phone.trim())) {
      errors.phone = 'Phone must be exactly 10 digits';
    }

    if (formData.aadhaarNumber && !/^\d{12}$/.test(formData.aadhaarNumber.trim())) {
      errors.aadhaarNumber = 'Aadhaar must be exactly 12 digits';
    }

    if (formData.creditScore) {
      const score = Number(formData.creditScore);
      if (isNaN(score) || score < 300 || score > 900) {
        errors.creditScore = 'Credit score must be between 300 and 900';
      }
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the errors in the form.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setDuplicateConflict(null);

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      panNumber: formData.panNumber.trim().toUpperCase(),
      aadhaarNumber: formData.aadhaarNumber ? formData.aadhaarNumber.trim() : null,
      dateOfBirth: formData.dateOfBirth || null,
      address: formData.address ? formData.address.trim() : null,
      employmentType: formData.employmentType || 'SALARIED',
      annualIncome: formData.annualIncome ? parseFloat(formData.annualIncome) : null,
      creditScore: formData.creditScore ? parseInt(formData.creditScore, 10) : null,
    };

    const res = await createCustomer(payload);

    if (res.success) {
      toast.success('Customer profile created successfully! 🎉');
      router.push(`/customers/${res.data.id}`);
    } else if (res.status === 409 && res.data) {
      const msg = res.data.message || 'A customer with this PAN already exists.';
      setDuplicateConflict({
        message: msg,
        existingCustomerId: res.data.existingCustomerId,
      });
      toast.error(msg);
    } else {
      toast.error(res.message || 'Failed to create customer profile.');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-pulse flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="text-sm font-medium">Loading session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb & Navigation */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/customers" className="hover:text-blue-600 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Customers
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-800">New Applicant Registration</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Register New Customer</h1>
              <p className="text-sm text-slate-500 mt-1">
                Enter applicant KYC identity, contact, and financial details
              </p>
            </div>
          </div>

          {/* Duplicate PAN Warning Banner (409 Conflict) */}
          {duplicateConflict && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-amber-900 shadow-sm animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-sm">Duplicate Customer Detected</h4>
                <p className="text-xs text-amber-800 mt-0.5">{duplicateConflict.message}</p>
              </div>
              {duplicateConflict.existingCustomerId && (
                <Link
                  href={`/customers/${duplicateConflict.existingCustomerId}`}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  View Existing Customer <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          )}

          {/* Form Card */}
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
            {/* Section 1: Identity & Contact */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Section 1 — Identity & Contact Details
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Full Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder="e.g. Ravi Kumar"
                    className={`w-full px-3.5 py-2 bg-white border ${
                      validationErrors.fullName ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:ring-blue-100'
                    } rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all`}
                  />
                  {validationErrors.fullName && (
                    <p className="text-xs text-rose-600">{validationErrors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="ravi.kumar@example.com"
                    className={`w-full px-3.5 py-2 bg-white border ${
                      validationErrors.email ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:ring-blue-100'
                    } rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all`}
                  />
                  {validationErrors.email && (
                    <p className="text-xs text-rose-600">{validationErrors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    10-Digit Mobile Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    maxLength={10}
                    className={`w-full px-3.5 py-2 bg-white border ${
                      validationErrors.phone ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:ring-blue-100'
                    } rounded-lg text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all`}
                  />
                  {validationErrors.phone && (
                    <p className="text-xs text-rose-600">{validationErrors.phone}</p>
                  )}
                </div>

                {/* PAN Input Component */}
                <PanInput
                  value={formData.panNumber}
                  onChange={(val) => handleChange('panNumber', val)}
                  error={validationErrors.panNumber}
                />

                {/* Aadhaar Number */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Aadhaar Number <span className="text-slate-400 font-normal">(Optional — 12 digits)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.aadhaarNumber}
                    onChange={(e) => handleChange('aadhaarNumber', e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder="1234 5678 9012"
                    maxLength={12}
                    className={`w-full px-3.5 py-2 bg-white border ${
                      validationErrors.aadhaarNumber ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:ring-blue-100'
                    } rounded-lg text-sm font-mono tracking-widest text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all`}
                  />
                  {validationErrors.aadhaarNumber && (
                    <p className="text-xs text-rose-600">{validationErrors.aadhaarNumber}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Personal Details */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Section 2 — Personal Details
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Date of Birth <span className="text-slate-400 font-normal">(Age ≥ 18)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Residential Address */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Residential Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Enter complete residential address, city, state, pincode..."
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Financial Profile */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Section 3 — Financial Profile
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Employment Type */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Employment Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => handleChange('employmentType', e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="SALARIED">Salaried</option>
                    <option value="SELF_EMPLOYED">Self Employed</option>
                    <option value="BUSINESS_OWNER">Business Owner</option>
                    <option value="RETIRED">Retired</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Annual Income */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Annual Income (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={formData.annualIncome}
                    onChange={(e) => handleChange('annualIncome', e.target.value)}
                    placeholder="e.g. 1200000"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Credit Score */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    CIBIL Credit Score <span className="text-slate-400 font-normal">(300–900)</span>
                  </label>
                  <input
                    type="number"
                    min="300"
                    max="900"
                    value={formData.creditScore}
                    onChange={(e) => handleChange('creditScore', e.target.value)}
                    placeholder="e.g. 750"
                    className={`w-full px-3.5 py-2 bg-white border ${
                      validationErrors.creditScore ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:ring-blue-100'
                    } rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all`}
                  />
                  {validationErrors.creditScore && (
                    <p className="text-xs text-rose-600">{validationErrors.creditScore}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Footer Action Buttons */}
            <div className="p-6 bg-slate-50 flex items-center justify-between">
              <Link
                href="/customers"
                className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-sm rounded-lg transition-colors"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? 'Registering Customer...' : 'Save & Register Customer'}</span>
              </button>
            </div>
          </form>
    </div>
  );
}
