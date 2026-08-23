'use client';

import React, { useState } from 'react';
import { useActivityLogs } from '../../hooks/useActivityLogs';
import ActivityEntry from './ActivityEntry';
import AddNoteForm from './AddNoteForm';
import ActivityFilterDropdown from './ActivityFilterDropdown';
import {
  shouldShowDateDivider,
  formatDateDivider,
} from '../../lib/activityDescriptions';

export default function ActivityTimeline({ applicationId }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [actionsFilter, setActionsFilter] = useState([]);
  const [showNoteForm, setShowNoteForm] = useState(false);

  const {
    logs,
    loading,
    loadingMore,
    error,
    refetch,
    loadMore,
    hasMore,
  } = useActivityLogs(applicationId, actionsFilter);

  const handleFilterChange = (catKey, actions) => {
    setSelectedCategory(catKey);
    setActionsFilter(actions);
  };

  const handleNoteSuccess = () => {
    setShowNoteForm(false);
    refetch();
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <span>📜</span> Activity History & Audit Log
        </h3>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <ActivityFilterDropdown
            selectedCategory={selectedCategory}
            onSelectCategory={handleFilterChange}
          />

          {/* Add Note Button */}
          <button
            onClick={() => setShowNoteForm((prev) => !prev)}
            className="px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center gap-1"
          >
            <span>+ Add Note</span>
          </button>
        </div>
      </div>

      {/* Add Note Inline Form Card */}
      {showNoteForm && (
        <AddNoteForm
          applicationId={applicationId}
          onSuccess={handleNoteSuccess}
          onCancel={() => setShowNoteForm(false)}
        />
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={refetch} className="underline font-bold text-rose-800">
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4 py-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 pl-8 animate-pulse">
              <div className="w-3 h-3 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-3/4" />
                <div className="h-2 bg-slate-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        /* Empty State */
        <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
          <div className="text-xl mb-1">📜</div>
          <p className="font-medium text-slate-600">No activity logs found.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {selectedCategory !== 'ALL'
              ? 'Try selecting "All Activities" from the filter.'
              : 'Actions on this loan application will appear here automatically.'}
          </p>
        </div>
      ) : (
        /* Vertical Timeline List */
        <div className="relative pt-1">
          {/* Vertical continuous line */}
          <div className="absolute left-[5px] top-2 bottom-3 w-0.5 bg-slate-200" />

          <div className="space-y-1">
            {logs.map((log, index) => {
              const showDivider = shouldShowDateDivider(logs, index);
              return (
                <React.Fragment key={log.id}>
                  {showDivider && (
                    <div className="relative flex items-center gap-2 my-3 pl-8">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {formatDateDivider(log.createdAt)}
                      </span>
                      <div className="h-px bg-slate-200 flex-1" />
                    </div>
                  )}
                  <ActivityEntry log={log} />
                </React.Fragment>
              );
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-2 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 py-2 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                {loadingMore ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent" />
                    <span>Loading more logs...</span>
                  </>
                ) : (
                  <span>Load older activities ↓</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
