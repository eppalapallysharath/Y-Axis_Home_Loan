'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../redux/hooks';

const STANDARD_TEMPLATES = {
  CIBIL_CHECK: {
    title: 'Run CIBIL Score Check',
    description: 'Pull applicant credit score from CIBIL bureau. Flag if score is below 650.',
  },
  DOCUMENT_VERIFICATION: {
    title: 'Verify Financial Documents',
    description: 'Verify 6-month bank statements, last 3 years ITR, and 3 salary slips.',
  },
  LEGAL_TITLE_SEARCH: {
    title: 'Legal Title Search',
    description: 'Validate property title deed, encumbrance certificate, and ownership chain.',
  },
  PROPERTY_VALUATION: {
    title: 'Property Site Valuation',
    description: 'Arrange approved valuer site visit and obtain valuation report.',
  },
  FINAL_REVIEW: {
    title: 'Final Sanction Review',
    description: 'Manager reviews all completed verifications and issues final credit decision.',
  },
  OTHER: {
    title: '',
    description: '',
  },
};

export default function AddWorkItemForm({ onSubmit, onCancel, submitting }) {
  const { user } = useAuth();
  const canAssign = user && (user.role === 'ADMIN' || user.role === 'MANAGER');

  const [type, setType] = useState('CIBIL_CHECK');
  const [title, setTitle] = useState(STANDARD_TEMPLATES.CIBIL_CHECK.title);
  const [description, setDescription] = useState(STANDARD_TEMPLATES.CIBIL_CHECK.description);
  const [assignedToId, setAssignedToId] = useState('');
  const [executives, setExecutives] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    async function loadExecutives() {
      if (!canAssign) return;
      setLoadingUsers(true);
      try {
        const res = await api.get('/admin/users?role=EXECUTIVE&limit=100');
        setExecutives(res.data || []);
      } catch (err) {
        console.error('Failed to load executives for work item assignment:', err);
      } finally {
        setLoadingUsers(false);
      }
    }
    loadExecutives();
  }, [canAssign]);

  const handleTypeChange = (newType) => {
    setType(newType);
    const template = STANDARD_TEMPLATES[newType] || STANDARD_TEMPLATES.OTHER;
    if (template.title) {
      setTitle(template.title);
      setDescription(template.description);
    } else {
      setTitle('');
      setDescription('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !title.trim()) return;

    onSubmit({
      type,
      title: title.trim(),
      description: description ? description.trim() : null,
      assignedToId: assignedToId ? parseInt(assignedToId, 10) : null,
    });
  };

  return (
    <div className="bg-slate-50 border border-blue-200 rounded-xl p-4 mb-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          ➕ Add Work Item Task
        </h4>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 text-xs font-medium"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div className={`grid grid-cols-1 ${canAssign ? 'sm:grid-cols-2' : ''} gap-3`}>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
              Task Type *
            </label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="CIBIL_CHECK">📊 CIBIL Check</option>
              <option value="DOCUMENT_VERIFICATION">📄 Document Verification</option>
              <option value="LEGAL_TITLE_SEARCH">⚖️ Legal Title Search</option>
              <option value="PROPERTY_VALUATION">🏠 Property Site Valuation</option>
              <option value="FINAL_REVIEW">✅ Final Sanction Review</option>
              <option value="OTHER">📌 Other Custom Task</option>
            </select>
          </div>

          {canAssign && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                Assign To Executive (Optional)
              </label>
              {loadingUsers ? (
                <div className="p-2 text-slate-400">Loading executives...</div>
              ) : (
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Unassigned --</option>
                  {executives.map((exec) => (
                    <option key={exec.id} value={exec.id}>
                      {exec.name} {exec.teamName ? `(${exec.teamName})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
            Task Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Run CIBIL Score Check"
            className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
            maxLength={200}
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
            Description / Instructions
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional detailed instructions for the assigned executive..."
            className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
            maxLength={2000}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
}
