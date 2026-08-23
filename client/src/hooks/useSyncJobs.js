'use client';

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  fetchSyncJobs as fetchSyncJobsThunk,
  fetchSyncStats as fetchSyncStatsThunk,
  fetchSyncJobDetail as fetchSyncJobDetailThunk,
  retrySyncJob as retrySyncJobThunk,
  setSyncJobFilters,
  selectSyncJobs,
  selectSyncJobsPagination,
  selectSyncJobStats,
  selectCurrentSyncJob,
  selectSyncJobFilters,
  selectSyncJobsLoading,
  selectSyncStatsLoading,
  selectSyncJobDetailLoading,
  selectSyncRetryLoading,
  selectSyncJobsError,
} from '../redux/slices/syncJobSlice';

/**
 * Redux-backed Hook to fetch paginated & status-filtered CBS sync jobs
 */
export function useSyncJobs(initialFilters = {}) {
  const dispatch = useAppDispatch();
  const jobs = useAppSelector(selectSyncJobs);
  const pagination = useAppSelector(selectSyncJobsPagination);
  const loading = useAppSelector(selectSyncJobsLoading);
  const error = useAppSelector(selectSyncJobsError);
  const filters = useAppSelector(selectSyncJobFilters);

  useEffect(() => {
    if (Object.keys(initialFilters).length > 0) {
      dispatch(setSyncJobFilters(initialFilters));
    }
  }, []); // Run once on mount

  const refetch = useCallback(() => {
    dispatch(fetchSyncJobsThunk(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    dispatch(fetchSyncJobsThunk(filters));

    // Auto-refresh every 60s to pick up background retry worker updates
    const timer = setInterval(() => {
      dispatch(fetchSyncJobsThunk(filters));
    }, 60000);

    return () => clearInterval(timer);
  }, [dispatch, filters]);

  const updateFilters = useCallback(
    (newFilters) => {
      dispatch(setSyncJobFilters(newFilters));
    },
    [dispatch]
  );

  return {
    jobs,
    pagination,
    loading,
    error,
    filters,
    updateFilters,
    refetch,
  };
}

/**
 * Redux-backed Hook to fetch CBS Health summary statistics
 */
export function useSyncJobStats() {
  const dispatch = useAppDispatch();
  const stats = useAppSelector(selectSyncJobStats);
  const loading = useAppSelector(selectSyncStatsLoading);
  const error = useAppSelector(selectSyncJobsError);

  const refetch = useCallback(() => {
    dispatch(fetchSyncStatsThunk());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchSyncStatsThunk());

    // Refresh every 30s for health widget updates
    const timer = setInterval(() => {
      dispatch(fetchSyncStatsThunk());
    }, 30000);

    return () => clearInterval(timer);
  }, [dispatch]);

  return {
    stats,
    loading,
    error,
    refetch,
  };
}

/**
 * Redux-backed Hook to fetch a single application's CBS Sync Job details
 */
export function useSyncJobDetail(applicationId) {
  const dispatch = useAppDispatch();
  const syncJob = useAppSelector(selectCurrentSyncJob);
  const loading = useAppSelector(selectSyncJobDetailLoading);
  const error = useAppSelector(selectSyncJobsError);

  const refetch = useCallback(() => {
    if (applicationId) {
      dispatch(fetchSyncJobDetailThunk(applicationId));
    }
  }, [dispatch, applicationId]);

  useEffect(() => {
    if (applicationId) {
      dispatch(fetchSyncJobDetailThunk(applicationId));
    }
  }, [dispatch, applicationId]);

  return {
    syncJob,
    loading,
    error,
    refetch,
  };
}

/**
 * Redux-backed Hook for manually retrying a failed/exhausted sync job
 */
export function useManualRetry(applicationId) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectSyncRetryLoading);
  const error = useAppSelector(selectSyncJobsError);

  const retrySync = async () => {
    const resultAction = await dispatch(retrySyncJobThunk(applicationId));
    if (retrySyncJobThunk.fulfilled.match(resultAction)) {
      return { success: true, message: resultAction.payload.message };
    } else {
      return { success: false, message: resultAction.payload || 'Manual retry failed' };
    }
  };

  return {
    retrySync,
    loading,
    error,
  };
}
