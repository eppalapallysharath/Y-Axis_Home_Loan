'use client';

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  fetchApplications,
  fetchApplicationById,
  createApplication as createApplicationThunk,
  updateApplication as updateApplicationThunk,
  assignApplication as assignApplicationThunk,
  transitionStage as transitionStageThunk,
  setApplicationFilters,
  clearBlockingError,
  selectApplications,
  selectApplicationPagination,
  selectCurrentApplication,
  selectApplicationFilters,
  selectApplicationsLoading,
  selectApplicationDetailLoading,
  selectApplicationActionLoading,
  selectApplicationError,
  selectBlockingError,
} from '../redux/slices/applicationSlice';

/**
 * Redux-backed Hook to fetch paginated & filtered loan applications list
 */
export function useApplications(activeFilters) {
  const dispatch = useAppDispatch();
  const applications = useAppSelector(selectApplications);
  const pagination = useAppSelector(selectApplicationPagination);
  const loading = useAppSelector(selectApplicationsLoading);
  const error = useAppSelector(selectApplicationError);
  const reduxFilters = useAppSelector(selectApplicationFilters);

  // If activeFilters passed in (e.g. from URL in page component), use them; otherwise use Redux filters
  const currentFilters = activeFilters !== undefined ? activeFilters : reduxFilters;

  const refetch = useCallback(
    (customFilters) => {
      const filtersToFetch = customFilters !== undefined ? customFilters : currentFilters;
      dispatch(fetchApplications(filtersToFetch));
    },
    [dispatch, currentFilters]
  );

  useEffect(() => {
    dispatch(fetchApplications(currentFilters));
  }, [
    dispatch,
    currentFilters.search,
    currentFilters.stage,
    currentFilters.priority,
    currentFilters.loanType,
    currentFilters.assignedToId,
    currentFilters.customerId,
    currentFilters.fromDate,
    currentFilters.toDate,
    currentFilters.cbsSyncStatus,
    currentFilters.page,
    currentFilters.limit,
  ]);

  const updateFilters = useCallback(
    (newFilters) => {
      dispatch(setApplicationFilters(newFilters));
    },
    [dispatch]
  );

  return {
    applications,
    pagination,
    loading,
    error,
    filters: currentFilters,
    updateFilters,
    refetch,
  };
}

/**
 * Redux-backed Hook to fetch single loan application detail by ID
 */
export function useApplication(id) {
  const dispatch = useAppDispatch();
  const application = useAppSelector(selectCurrentApplication);
  const loading = useAppSelector(selectApplicationDetailLoading);
  const error = useAppSelector(selectApplicationError);

  const refetch = useCallback(() => {
    if (id) {
      dispatch(fetchApplicationById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (id) {
      dispatch(fetchApplicationById(id));
    }
  }, [dispatch, id]);

  return {
    application,
    loading,
    error,
    refetch,
  };
}

/**
 * Redux-backed Hook to create a loan application
 */
export function useCreateApplication() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectApplicationActionLoading);
  const error = useAppSelector(selectApplicationError);

  const createApplication = async (data) => {
    const resultAction = await dispatch(createApplicationThunk(data));
    if (createApplicationThunk.fulfilled.match(resultAction)) {
      return { success: true, data: resultAction.payload };
    } else {
      const err = resultAction.payload || {};
      return {
        success: false,
        error: err,
        status: err.status,
        data: err.data,
        message: err.message || 'Failed to create application',
      };
    }
  };

  return {
    createApplication,
    loading,
    error,
  };
}

/**
 * Redux-backed Hook to update a loan application
 */
export function useUpdateApplication(id) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectApplicationActionLoading);
  const error = useAppSelector(selectApplicationError);

  const updateApplication = async (data) => {
    const resultAction = await dispatch(updateApplicationThunk({ id, data }));
    if (updateApplicationThunk.fulfilled.match(resultAction)) {
      return { success: true, data: resultAction.payload };
    } else {
      const err = resultAction.payload || {};
      return {
        success: false,
        error: err,
        status: err.status,
        data: err.data,
        message: err.message || 'Failed to update application',
      };
    }
  };

  return {
    updateApplication,
    loading,
    error,
  };
}

/**
 * Redux-backed Hook to assign or reassign a loan application
 */
export function useAssignApplication(id) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectApplicationActionLoading);
  const error = useAppSelector(selectApplicationError);

  const assignApplication = async (assignedToId) => {
    const resultAction = await dispatch(assignApplicationThunk({ id, assignedToId }));
    if (assignApplicationThunk.fulfilled.match(resultAction)) {
      return { success: true, data: resultAction.payload };
    } else {
      const err = resultAction.payload || {};
      return {
        success: false,
        error: err,
        status: err.status,
        data: err.data,
        message: err.message || 'Failed to assign application',
      };
    }
  };

  return {
    assignApplication,
    loading,
    error,
  };
}

/**
 * Redux-backed Hook to transition workflow stage of a loan application
 */
export function useStageTransition(id) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectApplicationActionLoading);
  const error = useAppSelector(selectApplicationError);
  const blockingError = useAppSelector(selectBlockingError);

  const transitionStage = async ({ toStage, rejectionReason, updatedAt }) => {
    const resultAction = await dispatch(
      transitionStageThunk({ id, toStage, rejectionReason, updatedAt })
    );

    if (transitionStageThunk.fulfilled.match(resultAction)) {
      return {
        success: true,
        data: resultAction.payload.data,
        message: resultAction.payload.message,
      };
    } else {
      const payload = resultAction.payload || {};
      if (payload.isBlockingError) {
        return {
          success: false,
          isBlockingError: true,
          blockingError: payload.blockingError,
          message: payload.message,
        };
      }
      return {
        success: false,
        status: payload.status,
        data: payload.data,
        message: payload.message || 'Stage transition failed.',
      };
    }
  };

  return {
    transitionStage,
    loading,
    error,
    blockingError,
    clearBlockingError: () => dispatch(clearBlockingError()),
  };
}
