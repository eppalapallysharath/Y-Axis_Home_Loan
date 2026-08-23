'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

/**
 * Hook to fetch paginated & filtered loan applications list
 */
export function useApplications(initialFilters = {}) {
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    stage: '',
    priority: '',
    loanType: '',
    assignedToId: '',
    customerId: '',
    fromDate: '',
    toDate: '',
    cbsSyncStatus: '',
    page: 1,
    limit: 20,
    ...initialFilters,
  });

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.stage) params.append('stage', filters.stage);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.loanType) params.append('loanType', filters.loanType);
      if (filters.assignedToId) params.append('assignedToId', String(filters.assignedToId));
      if (filters.customerId) params.append('customerId', String(filters.customerId));
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.cbsSyncStatus) params.append('cbsSyncStatus', filters.cbsSyncStatus);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/applications${queryStr}`);

      setApplications(response.data || []);
      setPagination(response.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  }, [
    filters.search,
    filters.stage,
    filters.priority,
    filters.loanType,
    filters.assignedToId,
    filters.customerId,
    filters.fromDate,
    filters.toDate,
    filters.cbsSyncStatus,
    filters.page,
    filters.limit,
  ]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  };

  return {
    applications,
    pagination,
    loading,
    error,
    filters,
    updateFilters,
    refetch: fetchApplications,
  };
}

/**
 * Hook to fetch single loan application detail by ID
 */
export function useApplication(id) {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplication = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/applications/${id}`);
      setApplication(response.data);
    } catch (err) {
      console.error(`Error fetching application ${id}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  return {
    application,
    loading,
    error,
    refetch: fetchApplication,
  };
}

/**
 * Hook to create a loan application
 */
export function useCreateApplication() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createApplication = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/applications', data);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error creating application:', err);
      setError(err);
      return {
        success: false,
        error: err,
        status: err.status,
        data: err.data,
        message: err.message || err.data?.message,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    createApplication,
    loading,
    error,
  };
}

/**
 * Hook to update a loan application
 */
export function useUpdateApplication(id) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateApplication = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.patch(`/applications/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      console.error(`Error updating application ${id}:`, err);
      setError(err);
      return {
        success: false,
        error: err,
        status: err.status,
        data: err.data,
        message: err.message || err.data?.message,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    updateApplication,
    loading,
    error,
  };
}

/**
 * Hook to assign or reassign a loan application
 */
export function useAssignApplication(id) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const assignApplication = async (assignedToId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.patch(`/applications/${id}/assign`, { assignedToId });
      return { success: true, data: response.data };
    } catch (err) {
      console.error(`Error assigning application ${id}:`, err);
      setError(err);
      return {
        success: false,
        error: err,
        status: err.status,
        data: err.data,
        message: err.message || err.data?.message,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    assignApplication,
    loading,
    error,
  };
}

/**
 * Hook to transition workflow stage of a loan application
 */
export function useStageTransition(id) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [blockingError, setBlockingError] = useState(null);

  const transitionStage = async ({ toStage, rejectionReason, updatedAt }) => {
    setLoading(true);
    setError(null);
    setBlockingError(null);
    try {
      const response = await api.patch(`/applications/${id}/stage`, {
        toStage,
        rejectionReason,
        updatedAt,
      });
      return { success: true, data: response.data, message: response.message };
    } catch (err) {
      setError(err);

      if (err.data?.error === 'WorkItemBlockingError') {
        console.warn(`Stage transition blocked for application ${id}:`, err.data.message || err.message);
        const blocking = {
          message: err.data.message || err.message,
          blockingItems: err.data.blockingItems || [],
        };
        setBlockingError(blocking);
        return {
          success: false,
          isBlockingError: true,
          blockingError: blocking,
          message: err.data.message,
        };
      }

      console.error(`Error transitioning stage for application ${id}:`, err);

      return {
        success: false,
        status: err.status,
        data: err.data,
        message: err.message || err.data?.message || 'Stage transition failed.',
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    transitionStage,
    loading,
    error,
    blockingError,
    clearBlockingError: () => setBlockingError(null),
  };
}

