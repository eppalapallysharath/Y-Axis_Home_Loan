'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

/**
 * Hook to fetch work items list for a specific loan application
 */
export function useWorkItems(appId) {
  const [workItems, setWorkItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWorkItems = useCallback(async () => {
    if (!appId || isNaN(appId)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/applications/${appId}/work-items`);
      setWorkItems(res.data || []);
    } catch (err) {
      console.error(`Error fetching work items for application #${appId}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    fetchWorkItems();
  }, [fetchWorkItems]);

  return { workItems, loading, error, refetch: fetchWorkItems };
}

/**
 * Hook to create a work item
 */
export function useCreateWorkItem(appId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createWorkItem = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/applications/${appId}/work-items`, payload);
      return { success: true, data: res.data };
    } catch (err) {
      setError(err);
      return {
        success: false,
        message: err.data?.message || err.message || 'Failed to create work item',
        error: err,
      };
    } finally {
      setLoading(false);
    }
  };

  return { createWorkItem, loading, error };
}

/**
 * Hook to apply standard checklist (bulk create standard work items)
 */
export function useApplyChecklist(appId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const applyChecklist = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/applications/${appId}/work-items/bulk`);
      return { success: true, data: res.data, message: res.message };
    } catch (err) {
      setError(err);
      return {
        success: false,
        message: err.data?.message || err.message || 'Failed to apply standard checklist',
        error: err,
      };
    } finally {
      setLoading(false);
    }
  };

  return { applyChecklist, loading, error };
}

/**
 * Hook to update a work item (status, assignment, details)
 */
export function useUpdateWorkItem(appId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateWorkItem = async (itemId, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.patch(`/applications/${appId}/work-items/${itemId}`, payload);
      return { success: true, data: res.data };
    } catch (err) {
      setError(err);
      return {
        success: false,
        message: err.data?.message || err.message || 'Failed to update work item',
        error: err,
      };
    } finally {
      setLoading(false);
    }
  };

  return { updateWorkItem, loading, error };
}

/**
 * Hook to delete an OPEN work item
 */
export function useDeleteWorkItem(appId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteWorkItem = async (itemId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.delete(`/applications/${appId}/work-items/${itemId}`);
      return { success: true, message: res.message };
    } catch (err) {
      setError(err);
      return {
        success: false,
        message: err.data?.message || err.message || 'Failed to delete work item',
        error: err,
      };
    } finally {
      setLoading(false);
    }
  };

  return { deleteWorkItem, loading, error };
}
