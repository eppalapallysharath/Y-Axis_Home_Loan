'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

/**
 * Hook to fetch paginated & status-filtered CBS sync jobs
 */
export function useSyncJobs(initialFilters = {}) {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 20,
    ...initialFilters,
  });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/sync-jobs${queryStr}`);

      setJobs(response.data || []);
      setPagination(response.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch (err) {
      console.error('Error fetching CBS sync jobs:', err);
      setError(err.message || 'Failed to fetch sync jobs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchJobs();

    // Auto-refresh every 60s to pick up background retry worker updates
    const timer = setInterval(() => {
      fetchJobs();
    }, 60000);

    return () => clearInterval(timer);
  }, [fetchJobs]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  };

  return {
    jobs,
    pagination,
    loading,
    error,
    filters,
    updateFilters,
    refetch: fetchJobs,
  };
}

/**
 * Hook to fetch CBS Health summary statistics
 */
export function useSyncJobStats() {
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    pending: 0,
    inProgress: 0,
    failed: 0,
    exhausted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/sync-jobs/stats');
      setStats(
        response.data || {
          total: 0,
          success: 0,
          pending: 0,
          inProgress: 0,
          failed: 0,
          exhausted: 0,
        }
      );
    } catch (err) {
      console.error('Error fetching CBS sync stats:', err);
      setError(err.message || 'Failed to fetch CBS stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Refresh every 30s for health widget updates
    const timer = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(timer);
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

/**
 * Hook to fetch a single application's CBS Sync Job details
 */
export function useSyncJobDetail(applicationId) {
  const [syncJob, setSyncJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJob = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/sync-jobs/${applicationId}`);
      setSyncJob(response.data || null);
    } catch (err) {
      if (
        err.status === 404 ||
        err.data?.statusCode === 404 ||
        (err.message && err.message.toLowerCase().includes('not found'))
      ) {
        // No CBS sync job record exists yet for this application (normal state)
        setSyncJob(null);
        setError(null);
      } else {
        console.warn(`Error fetching CBS sync job for app #${applicationId}:`, err.message);
        setError(err.message || 'Failed to fetch sync job detail');
      }
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  return {
    syncJob,
    loading,
    error,
    refetch: fetchJob,
  };
}

/**
 * Hook for manually retrying a failed/exhausted sync job
 */
export function useManualRetry(applicationId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const retrySync = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/sync-jobs/${applicationId}/retry`);
      return { success: true, message: response.message };
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Manual retry failed';
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  };

  return {
    retrySync,
    loading,
    error,
  };
}
