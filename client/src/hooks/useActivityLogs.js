'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

/**
 * Hook to fetch paginated & filtered activity logs for a loan application
 */
export function useActivityLogs(appId, initialActions = []) {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [actionsFilter, setActionsFilter] = useState(initialActions);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const fetchActivityLogs = useCallback(
    async (pageToFetch = 1, append = false) => {
      if (!appId) return;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append('page', String(pageToFetch));
        params.append('limit', '20');

        if (actionsFilter && actionsFilter.length > 0) {
          params.append('actions', actionsFilter.join(','));
        }

        const res = await api.get(`/applications/${appId}/activity?${params.toString()}`);

        if (append) {
          setLogs((prev) => [...prev, ...(res.data || [])]);
        } else {
          setLogs(res.data || []);
        }

        setPagination(
          res.pagination || {
            total: 0,
            page: pageToFetch,
            limit: 20,
            totalPages: 1,
          }
        );
      } catch (err) {
        setError(err.data?.message || err.message || 'Failed to fetch activity logs.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [appId, actionsFilter]
  );

  useEffect(() => {
    fetchActivityLogs(1, false);
  }, [fetchActivityLogs]);

  const loadMore = () => {
    if (pagination.page < pagination.totalPages && !loadingMore) {
      fetchActivityLogs(pagination.page + 1, true);
    }
  };

  return {
    logs,
    pagination,
    actionsFilter,
    setActionsFilter,
    loading,
    loadingMore,
    error,
    refetch: () => fetchActivityLogs(1, false),
    loadMore,
    hasMore: pagination.page < pagination.totalPages,
  };
}

/**
 * Hook to submit a manual note to the application activity log
 */
export function useAddNote(appId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addNote = async (noteText) => {
    if (!noteText || !noteText.trim()) {
      return { success: false, message: 'Note text cannot be empty.' };
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post(`/applications/${appId}/notes`, { noteText: noteText.trim() });
      setLoading(false);
      return { success: true, message: res.message || 'Note added successfully', data: res.data };
    } catch (err) {
      setLoading(false);
      const msg = err.data?.message || err.message || 'Failed to add note.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  return { addNote, loading, error };
}
