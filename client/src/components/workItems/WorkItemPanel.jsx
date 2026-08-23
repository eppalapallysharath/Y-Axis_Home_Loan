'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import WorkItemRow from './WorkItemRow';
import AddWorkItemForm from './AddWorkItemForm';
import {
  useWorkItems,
  useCreateWorkItem,
  useApplyChecklist,
  useUpdateWorkItem,
  useDeleteWorkItem,
} from '../../hooks/useWorkItems';

export default function WorkItemPanel({ application, onWorkItemChange }) {
  const appId = application?.id;

  const { workItems, loading, error, refetch } = useWorkItems(appId);
  const { createWorkItem, loading: creating } = useCreateWorkItem(appId);
  const { applyChecklist, loading: applyingChecklist } = useApplyChecklist(appId);
  const { updateWorkItem, loading: updating } = useUpdateWorkItem(appId);
  const { deleteWorkItem, loading: deleting } = useDeleteWorkItem(appId);

  const [showAddForm, setShowAddForm] = useState(false);

  const handleCreateTask = async (payload) => {
    const res = await createWorkItem(payload);
    if (res.success) {
      toast.success('Work item created successfully ✅');
      setShowAddForm(false);
      refetch();
      if (onWorkItemChange) onWorkItemChange();
    } else {
      toast.error(res.message || 'Failed to create work item');
    }
  };

  const handleApplyChecklist = async () => {
    if (window.confirm('Apply standard verification checklist? This will create standard work items.')) {
      const res = await applyChecklist();
      if (res.success) {
        toast.success(res.message || 'Standard checklist applied!');
        refetch();
        if (onWorkItemChange) onWorkItemChange();
      } else {
        toast.error(res.message || 'Failed to apply checklist');
      }
    }
  };

  const handleUpdateStatus = async (itemId, newStatus) => {
    const res = await updateWorkItem(itemId, { status: newStatus });
    if (res.success) {
      const msg = newStatus === 'COMPLETED' ? 'Work item marked as COMPLETED ✅' : `Work item moved to ${newStatus}`;
      toast.success(msg);
      refetch();
      if (onWorkItemChange) onWorkItemChange();
    } else {
      toast.error(res.message || 'Failed to update work item status');
    }
  };

  const handleDeleteTask = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this open work item?')) {
      const res = await deleteWorkItem(itemId);
      if (res.success) {
        toast.success('Work item deleted successfully.');
        refetch();
        if (onWorkItemChange) onWorkItemChange();
      } else {
        toast.error(res.message || 'Failed to delete work item');
      }
    }
  };

  // Calculations for progress header
  const totalCount = workItems.length;
  const completedCount = workItems.filter((w) => w.status === 'COMPLETED').length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isTerminal = ['COMPLETED', 'REJECTED'].includes(application?.stage);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">

      {/* Header & Progress Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Work Items Tasks ({completedCount}/{totalCount} Completed)
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Verification checklist & underwriter tasks required before stage advancement.
          </p>
        </div>

        {/* Action Buttons */}
        {!isTerminal && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyChecklist}
              disabled={applyingChecklist}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
              title="Pre-create all 5 standard verification work items"
            >
              ⚡ Apply Checklist
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              {showAddForm ? 'Close Form' : '➕ Add Task'}
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="space-y-1">
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progressPercent === 100 ? 'bg-emerald-600' : 'bg-blue-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-right text-slate-400 font-semibold">
            {progressPercent}% Complete
          </div>
        </div>
      )}

      {/* Add Work Item Inline Form */}
      {showAddForm && !isTerminal && (
        <AddWorkItemForm
          onSubmit={handleCreateTask}
          onCancel={() => setShowAddForm(false)}
          submitting={creating}
        />
      )}

      {/* Work Item List */}
      {loading ? (
        <div className="text-center py-6 text-xs text-slate-400">Loading work items...</div>
      ) : workItems.length > 0 ? (
        <div className="space-y-2.5">
          {workItems.map((item) => (
            <WorkItemRow
              key={item.id}
              item={item}
              application={application}
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDeleteTask}
              updating={updating}
              deleting={deleting}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
          <div className="text-2xl">📋</div>
          <div className="text-xs font-semibold text-slate-700">No Work Items Created Yet</div>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Click "Apply Checklist" to pre-create standard verification tasks or "+ Add Task" to create a custom item.
          </p>
          {!isTerminal && (
            <button
              onClick={handleApplyChecklist}
              disabled={applyingChecklist}
              className="mt-2 px-4 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors"
            >
              ⚡ Apply Standard Verification Checklist
            </button>
          )}
        </div>
      )}
    </div>
  );
}
