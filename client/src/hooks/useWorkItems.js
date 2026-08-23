'use client';

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  fetchWorkItems,
  createWorkItem as createWorkItemThunk,
  applyChecklist as applyChecklistThunk,
  updateWorkItem as updateWorkItemThunk,
  deleteWorkItem as deleteWorkItemThunk,
  selectWorkItems,
  selectWorkItemsLoading,
  selectWorkItemActionLoading,
  selectWorkItemsError,
} from '../redux/slices/workItemSlice';

/**
 * Redux-backed Hook to fetch work items list for a specific loan application
 */
export function useWorkItems(appId) {
  const dispatch = useAppDispatch();
  const workItems = useAppSelector(selectWorkItems);
  const loading = useAppSelector(selectWorkItemsLoading);
  const error = useAppSelector(selectWorkItemsError);

  const refetch = useCallback(() => {
    if (appId && !isNaN(appId)) {
      dispatch(fetchWorkItems(appId));
    }
  }, [dispatch, appId]);

  useEffect(() => {
    if (appId && !isNaN(appId)) {
      dispatch(fetchWorkItems(appId));
    }
  }, [dispatch, appId]);

  return { workItems, loading, error, refetch };
}

/**
 * Redux-backed Hook to create a work item
 */
export function useCreateWorkItem(appId) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectWorkItemActionLoading);
  const error = useAppSelector(selectWorkItemsError);

  const createWorkItem = async (payload) => {
    const resultAction = await dispatch(createWorkItemThunk({ appId, payload }));
    if (createWorkItemThunk.fulfilled.match(resultAction)) {
      return { success: true, data: resultAction.payload };
    } else {
      const err = resultAction.payload || {};
      return {
        success: false,
        message: err.message || 'Failed to create work item',
        error: err.error,
      };
    }
  };

  return { createWorkItem, loading, error };
}

/**
 * Redux-backed Hook to apply standard checklist (bulk create standard work items)
 */
export function useApplyChecklist(appId) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectWorkItemActionLoading);
  const error = useAppSelector(selectWorkItemsError);

  const applyChecklist = async () => {
    const resultAction = await dispatch(applyChecklistThunk(appId));
    if (applyChecklistThunk.fulfilled.match(resultAction)) {
      return {
        success: true,
        data: resultAction.payload.data,
        message: resultAction.payload.message,
      };
    } else {
      const err = resultAction.payload || {};
      return {
        success: false,
        message: err.message || 'Failed to apply standard checklist',
        error: err.error,
      };
    }
  };

  return { applyChecklist, loading, error };
}

/**
 * Redux-backed Hook to update a work item (status, assignment, details)
 */
export function useUpdateWorkItem(appId) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectWorkItemActionLoading);
  const error = useAppSelector(selectWorkItemsError);

  const updateWorkItem = async (itemId, payload) => {
    const resultAction = await dispatch(updateWorkItemThunk({ appId, itemId, payload }));
    if (updateWorkItemThunk.fulfilled.match(resultAction)) {
      return { success: true, data: resultAction.payload };
    } else {
      const err = resultAction.payload || {};
      return {
        success: false,
        message: err.message || 'Failed to update work item',
        error: err.error,
      };
    }
  };

  return { updateWorkItem, loading, error };
}

/**
 * Redux-backed Hook to delete an OPEN work item
 */
export function useDeleteWorkItem(appId) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectWorkItemActionLoading);
  const error = useAppSelector(selectWorkItemsError);

  const deleteWorkItem = async (itemId) => {
    const resultAction = await dispatch(deleteWorkItemThunk({ appId, itemId }));
    if (deleteWorkItemThunk.fulfilled.match(resultAction)) {
      return { success: true, message: resultAction.payload.message };
    } else {
      const err = resultAction.payload || {};
      return {
        success: false,
        message: err.message || 'Failed to delete work item',
        error: err.error,
      };
    }
  };

  return { deleteWorkItem, loading, error };
}
