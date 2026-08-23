'use client';

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  fetchActivityLogs as fetchActivityLogsThunk,
  addNote as addNoteThunk,
  setActionsFilter as setActionsFilterAction,
  selectActivityLogs,
  selectActivityPagination,
  selectActivityActionsFilter,
  selectActivityLoading,
  selectActivityLoadingMore,
  selectActivityActionLoading,
  selectActivityError,
} from '../redux/slices/activityLogSlice';

/**
 * Redux-backed Hook to fetch paginated & filtered activity logs for a loan application
 */
export function useActivityLogs(appId, initialActions = []) {
  const dispatch = useAppDispatch();
  const logs = useAppSelector(selectActivityLogs);
  const pagination = useAppSelector(selectActivityPagination);
  const actionsFilter = useAppSelector(selectActivityActionsFilter);
  const loading = useAppSelector(selectActivityLoading);
  const loadingMore = useAppSelector(selectActivityLoadingMore);
  const error = useAppSelector(selectActivityError);

  useEffect(() => {
    if (initialActions && initialActions.length > 0) {
      dispatch(setActionsFilterAction(initialActions));
    }
  }, []); // Run once on mount

  const fetchLogs = useCallback(
    (pageToFetch = 1, append = false) => {
      if (!appId) return;
      dispatch(
        fetchActivityLogsThunk({
          appId,
          page: pageToFetch,
          limit: 20,
          actions: actionsFilter,
          append,
        })
      );
    },
    [dispatch, appId, actionsFilter]
  );

  useEffect(() => {
    fetchLogs(1, false);
  }, [fetchLogs]);

  const loadMore = () => {
    if (pagination.page < pagination.totalPages && !loadingMore) {
      fetchLogs(pagination.page + 1, true);
    }
  };

  const setActionsFilter = (actions) => {
    dispatch(setActionsFilterAction(actions));
  };

  return {
    logs,
    pagination,
    actionsFilter,
    setActionsFilter,
    loading,
    loadingMore,
    error,
    refetch: () => fetchLogs(1, false),
    loadMore,
    hasMore: pagination.page < pagination.totalPages,
  };
}

/**
 * Redux-backed Hook to submit a manual note to the application activity log
 */
export function useAddNote(appId) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectActivityActionLoading);
  const error = useAppSelector(selectActivityError);

  const addNote = async (noteText) => {
    if (!noteText || !noteText.trim()) {
      return { success: false, message: 'Note text cannot be empty.' };
    }

    const resultAction = await dispatch(addNoteThunk({ appId, noteText }));
    if (addNoteThunk.fulfilled.match(resultAction)) {
      return {
        success: true,
        message: resultAction.payload.message,
        data: resultAction.payload.data,
      };
    } else {
      return {
        success: false,
        message: resultAction.payload || 'Failed to add note.',
      };
    }
  };

  return { addNote, loading, error };
}
