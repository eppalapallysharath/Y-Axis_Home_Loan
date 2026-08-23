'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export default function AssignmentModal({ isOpen, onClose, currentAssigneeId, onAssign, loading }) {
  const [executives, setExecutives] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(currentAssigneeId || '');
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedUserId(currentAssigneeId || '');
      fetchExecutives();
    }
  }, [isOpen, currentAssigneeId]);

  const fetchExecutives = async () => {
    setFetchingUsers(true);
    setFetchError(null);
    try {
      // Fetch users with role EXECUTIVE
      const res = await api.get('/admin/users?role=EXECUTIVE&limit=100');
      const allUsers = res.data || [];
      const execsOnly = allUsers.filter((u) => u.role === 'EXECUTIVE');
      setExecutives(execsOnly);
    } catch (err) {
      console.error('Failed to fetch executives for assignment:', err);
      setFetchError('Could not load executives list.');
    } finally {
      setFetchingUsers(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const assignee = selectedUserId ? parseInt(selectedUserId, 10) : null;
    onAssign(assignee);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-base font-bold text-slate-900">Assign / Reassign Application</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg p-1 rounded-md"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Select Assignee (Executive)
            </label>
            {fetchingUsers ? (
              <div className="text-xs text-slate-500 py-2">Loading executives...</div>
            ) : fetchError ? (
              <div className="text-xs text-rose-600 py-1">{fetchError}</div>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">-- Unassigned --</option>
                {executives.map((exec) => {
                  const branchName = exec.teamName || (exec.team ? exec.team.name : null);
                  return (
                    <option key={exec.id} value={exec.id}>
                      {exec.name} {branchName && branchName !== 'Unassigned' ? `(${branchName})` : ''}
                    </option>
                  );
                })}
              </select>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              Managers can assign within their branch team. Admin can assign to any executive.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || fetchingUsers}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
