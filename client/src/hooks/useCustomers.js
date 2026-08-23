'use client';

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  fetchCustomers,
  fetchCustomerById,
  createCustomer as createCustomerThunk,
  setCustomerFilters,
  selectCustomers,
  selectCustomerPagination,
  selectCurrentCustomer,
  selectCustomerFilters,
  selectCustomersLoading,
  selectCustomerDetailLoading,
  selectCustomerActionLoading,
  selectCustomerError,
} from '../redux/slices/customerSlice';

/**
 * Redux-backed Hook to fetch paginated & filtered customers list
 */
export function useCustomers(activeFilters) {
  const dispatch = useAppDispatch();
  const customers = useAppSelector(selectCustomers);
  const pagination = useAppSelector(selectCustomerPagination);
  const loading = useAppSelector(selectCustomersLoading);
  const error = useAppSelector(selectCustomerError);
  const reduxFilters = useAppSelector(selectCustomerFilters);

  // If activeFilters passed in (e.g. from URL in page component), use them; otherwise use Redux filters
  const currentFilters = activeFilters !== undefined ? activeFilters : reduxFilters;

  const refetch = useCallback(
    (customFilters) => {
      const filtersToFetch = customFilters !== undefined ? customFilters : currentFilters;
      dispatch(fetchCustomers(filtersToFetch));
    },
    [dispatch, currentFilters]
  );

  useEffect(() => {
    dispatch(fetchCustomers(currentFilters));
  }, [
    dispatch,
    currentFilters.search,
    currentFilters.employmentType,
    currentFilters.fromDate,
    currentFilters.toDate,
    currentFilters.page,
    currentFilters.limit,
  ]);

  const updateFilters = useCallback(
    (newFilters) => {
      dispatch(setCustomerFilters(newFilters));
    },
    [dispatch]
  );

  return {
    customers,
    pagination,
    loading,
    error,
    filters: currentFilters,
    updateFilters,
    refetch,
  };
}

/**
 * Redux-backed Hook to fetch single customer detail by ID
 */
export function useCustomer(id) {
  const dispatch = useAppDispatch();
  const customer = useAppSelector(selectCurrentCustomer);
  const loading = useAppSelector(selectCustomerDetailLoading);
  const error = useAppSelector(selectCustomerError);

  const refetch = useCallback(() => {
    if (id) {
      dispatch(fetchCustomerById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (id) {
      dispatch(fetchCustomerById(id));
    }
  }, [dispatch, id]);

  return {
    customer,
    loading,
    error,
    refetch,
  };
}

/**
 * Redux-backed Hook to create a customer
 */
export function useCreateCustomer() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectCustomerActionLoading);
  const error = useAppSelector(selectCustomerError);

  const createCustomer = async (data) => {
    const resultAction = await dispatch(createCustomerThunk(data));
    if (createCustomerThunk.fulfilled.match(resultAction)) {
      return { success: true, data: resultAction.payload };
    } else {
      const err = resultAction.payload || {};
      return {
        success: false,
        error: err,
        status: err.status,
        data: err.data,
      };
    }
  };

  return {
    createCustomer,
    loading,
    error,
  };
}
