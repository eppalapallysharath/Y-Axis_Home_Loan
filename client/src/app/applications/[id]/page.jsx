'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  useApplication,
  useUpdateApplication,
  useAssignApplication,
  useStageTransition,
} from '../../../hooks/useApplications';
import StageBadge from '../../../components/applications/StageBadge';
import PriorityBadge from '../../../components/applications/PriorityBadge';
import CbsSyncBadge from '../../../components/applications/CbsSyncBadge';
import StageProgressBar from '../../../components/applications/StageProgressBar';
import StageTransitionButton from '../../../components/workflow/StageTransitionButton';
import LtvIndicator from '../../../components/applications/LtvIndicator';
import AssignmentModal from '../../../components/applications/AssignmentModal';
import WorkItemPanel from '../../../components/workItems/WorkItemPanel';
import ActivityTimeline from '../../../components/activity/ActivityTimeline';
import { useAuth } from '../../../redux/hooks';
import { useSyncJobDetail } from '../../../hooks/useSyncJobs';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const appId = parseInt(id, 10);

  const { user } = useAuth();
  const canAssign = user && (user.role === 'ADMIN' || user.role === 'MANAGER');
  const canSeeCbs = user && (user.role === 'ADMIN' || user.role === 'MANAGER');

  const { application, loading, error, refetch } = useApplication(appId);
  const { syncJob, refetch: refetchSyncJob } = useSyncJobDetail(canSeeCbs ? appId : null);
  const { updateApplication, loading: updating } = useUpdateApplication(appId);
  const { assignApplication, loading: assigning } = useAssignApplication(appId);
  const {
    transitionStage,
    loading: transitioning,
    blockingError,
    clearBlockingError,
  } = useStageTransition(appId);

  // Modals & UI States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleStageTransition = async ({ toStage, rejectionReason }) => {
    const res = await transitionStage({
      toStage,
      rejectionReason,
      updatedAt: application?.updatedAt,
    });

    if (res.success) {
      toast.success(res.message || `Application moved to ${toStage}`);
      refetch();
      refetchSyncJob();
      return true;
    } else {
      if (res.status === 409) {
        toast.error('Someone else updated this application. Please refresh.');
        refetch();
        refetchSyncJob();
      } else if (!res.isBlockingError) {
        toast.error(res.message || 'Stage transition failed.');
      }
      return false;
    }
  };

  // Edit form state
  const [editLoanAmount, setEditLoanAmount] = useState('');
  const [editPropertyAddress, setEditPropertyAddress] = useState('');
  const [editPropertyValue, setEditPropertyValue] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editPriority, setEditPriority] = useState('MEDIUM');

  const startEdit = () => {
    if (!application) return;
    setEditLoanAmount(String(application.loanAmount || ''));
    setEditPropertyAddress(application.propertyAddress || '');
    setEditPropertyValue(application.propertyValue ? String(application.propertyValue) : '');
    setEditRemarks(application.remarks || '');
    setEditPriority(application.priority || 'MEDIUM');
    setIsEditMode(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const amount = parseFloat(editLoanAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid positive loan amount.');
      return;
    }

    const propVal = editPropertyValue ? parseFloat(editPropertyValue) : null;

    const payload = {
      loanAmount: amount,
      propertyAddress: editPropertyAddress,
      propertyValue: propVal,
      remarks: editRemarks,
      priority: editPriority,
      updatedAt: application.updatedAt,
    };

    const res = await updateApplication(payload);

    if (res.success) {
      toast.success('Application updated successfully.');
      setIsEditMode(false);
      refetch();
    } else {
      if (res.status === 409) {
        toast.error('Someone else updated this application. Please refresh and try again.');
      } else {
        toast.error(res.message || 'Failed to update application.');
      }
    }
  };

  const handleAssign = async (targetAssigneeId) => {
    const res = await assignApplication(targetAssigneeId);
    if (res.success) {
      toast.success('Application assigned successfully.');
      setIsAssignModalOpen(false);
      refetch();
    } else {
      toast.error(res.message || 'Assignment failed.');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mb-3" />
        <p>Loading application details...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-6 bg-rose-50 border border-rose-200 rounded-xl text-center">
        <div className="text-2xl mb-2">⚠️</div>
        <h2 className="text-base font-bold text-rose-900 mb-1">Application Access Error</h2>
        <p className="text-xs text-rose-700 mb-4">
          {error?.data?.message || error?.message || 'Loan application not found or access forbidden.'}
        </p>
        <Link
          href="/applications"
          className="inline-flex px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
        >
          ← Back to Applications
        </Link>
      </div>
    );
  }

  const isTerminalStage = ['COMPLETED', 'REJECTED'].includes(application.stage);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <Link href="/applications" className="hover:text-blue-600">
              Applications
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">App #{application.id}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Application #{application.id}
            </h1>
            <StageBadge stage={application.stage} />
            <PriorityBadge priority={application.priority} />
            {canSeeCbs && (
              <CbsSyncBadge
                status={application.cbsSyncStatus}
                syncJob={syncJob}
                applicationId={appId}
                showDetail={true}
                onRetrySuccess={() => {
                  refetch();
                  refetchSyncJob();
                }}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canAssign && !isTerminalStage && (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
            >
              👤 Reassign Executive
            </button>
          )}
          {!isTerminalStage && !isEditMode && (
            <button
              onClick={startEdit}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              ✏️ Edit Fields
            </button>
          )}
        </div>
      </div>

      {/* Workflow Stage Stepper */}
      <StageProgressBar currentStage={application.stage} />

      {/* Stage Transition Control Bar */}
      <StageTransitionButton
        application={application}
        userRole={user?.role}
        onTransition={handleStageTransition}
        loading={transitioning}
        blockingError={blockingError}
        onClearBlockingError={clearBlockingError}
      />

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer & Loan Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
              Application Overview
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase">Applicant</span>
                <Link
                  href={`/customers/${application.customerId}`}
                  className="font-bold text-blue-600 hover:underline text-sm"
                >
                  {application.customer?.fullName}
                </Link>
                <div className="text-[11px] text-slate-400 font-mono">
                  PAN: {application.customer?.panNumber}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] uppercase">Loan Type</span>
                <span className="font-bold text-slate-900 text-sm">
                  {application.applicationType === 'HOME_LOAN'
                    ? 'Home Loan'
                    : application.applicationType === 'TOP_UP'
                    ? 'Top-Up Loan'
                    : application.applicationType === 'LAP'
                    ? 'Loan Against Property'
                    : application.applicationType}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] uppercase">Requested Amount</span>
                <span className="font-bold text-slate-900 text-base">
                  ₹{Number(application.loanAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] uppercase">Estimated Property Value</span>
                <span className="font-semibold text-slate-800">
                  {application.propertyValue
                    ? `₹${Number(application.propertyValue).toLocaleString('en-IN')}`
                    : 'Not Specified'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] uppercase">Created By</span>
                <span className="font-medium text-slate-700">
                  {application.createdBy?.name || 'System'}
                </span>
                <div className="text-[10px] text-slate-400">
                  {new Date(application.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] uppercase">Last Updated</span>
                <span className="font-medium text-slate-700">
                  {new Date(application.updatedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* Property Address & Remarks */}
            {(application.propertyAddress || application.remarks) && (
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {application.propertyAddress && (
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase">Property Address</span>
                    <p className="text-slate-700 mt-0.5">{application.propertyAddress}</p>
                  </div>
                )}
                {application.remarks && (
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase">Remarks</span>
                    <p className="text-slate-700 mt-0.5 italic">{application.remarks}</p>
                  </div>
                )}
              </div>
            )}

            {/* LTV Ratio Display */}
            <LtvIndicator
              loanAmount={application.loanAmount}
              propertyValue={application.propertyValue}
            />
          </div>

          {/* Edit Form Section */}
          {isEditMode && !isTerminalStage && (
            <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-md space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-blue-900">Edit Application Details</h3>
                <button
                  onClick={() => setIsEditMode(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Loan Amount (INR) *
                    </label>
                    <input
                      type="number"
                      value={editLoanAmount}
                      onChange={(e) => setEditLoanAmount(e.target.value)}
                      className="w-full text-xs text-slate-900 border border-slate-300 rounded-lg p-2.5 bg-white font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Priority Level
                    </label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      className="w-full text-xs text-slate-900 border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Property Address
                    </label>
                    <input
                      type="text"
                      value={editPropertyAddress}
                      onChange={(e) => setEditPropertyAddress(e.target.value)}
                      className="w-full text-xs text-slate-900 border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Property Value (INR)
                    </label>
                    <input
                      type="number"
                      value={editPropertyValue}
                      onChange={(e) => setEditPropertyValue(e.target.value)}
                      className="w-full text-xs text-slate-900 border border-slate-300 rounded-lg p-2.5 bg-white font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    className="w-full text-xs text-slate-900 border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    className="px-4 py-2 text-xs text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Linked Work Items Section */}
          <WorkItemPanel application={application} onWorkItemChange={refetch} />
        </div>

        {/* Right Column: Assignment & Activity History */}
        <div className="space-y-6">
          {/* Assignment Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
              Assignment & Scope
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase">Assigned Executive</span>
                {application.assignedTo ? (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                      {application.assignedTo.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{application.assignedTo.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {application.assignedTo.team?.name || 'Branch Team'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 p-2 bg-amber-50 text-amber-800 rounded border border-amber-200 font-medium">
                    ⚠️ Unassigned
                  </div>
                )}
              </div>

              {canAssign && !isTerminalStage && (
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="w-full text-xs py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors text-center"
                >
                  {application.assignedTo ? 'Change Executive Assignment' : 'Assign Executive Now'}
                </button>
              )}
            </div>
          </div>

          {/* Activity History Log Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <ActivityTimeline applicationId={appId} />
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        currentAssigneeId={application.assignedToId}
        onAssign={handleAssign}
        loading={assigning}
      />
    </div>
  );
}
