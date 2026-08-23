'use client';

import { useState } from 'react';
import { useAddNote } from '../../hooks/useActivityLogs';

export default function AddNoteForm({ applicationId, onSuccess, onCancel }) {
  const [noteText, setNoteText] = useState('');
  const [error, setError] = useState(null);
  const { addNote, loading } = useAddNote(applicationId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) {
      setError('Note text cannot be empty.');
      return;
    }
    if (noteText.trim().length > 1000) {
      setError('Note text must be 1000 characters or fewer.');
      return;
    }

    setError(null);
    const res = await addNote(noteText);
    if (res.success) {
      setNoteText('');
      if (onSuccess) onSuccess();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 shadow-sm animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
          <span>📝</span> Add Audit Note
        </span>
        <span className="text-[11px] text-amber-700 font-mono">
          {noteText.length}/1000
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          rows={3}
          value={noteText}
          onChange={(e) => {
            setNoteText(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Record a phone conversation, compliance flag, or internal note..."
          maxLength={1000}
          className="w-full text-xs text-slate-800 placeholder-amber-700/60 bg-white border border-amber-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-amber-500 resize-none font-sans"
        />

        {error && (
          <div className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="flex justify-end items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium rounded-lg"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!noteText.trim() || loading}
            className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Add Note</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
