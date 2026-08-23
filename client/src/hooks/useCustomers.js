'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

/**
 * Hook to fetch paginated & filtered customers list
 */
export function useCustomers(initialFilters = {}) {
  const [customers, setCustomers] = useState([]);
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
    employmentType: '',
    fromDate: '',
    toDate: '',
    page: 1,
    limit: 20,
    ...initialFilters,
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.employmentType) params.append('employmentType', filters.employmentType);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/customers${queryStr}`);

      setCustomers(response.data || []);
      setPagination(response.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.employmentType, filters.fromDate, filters.toDate, filters.page, filters.limit]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      // Reset page to 1 if search or filter changes
      page: newFilters.page !== undefined ? newFilters.page : (newFilters.search !== undefined || newFilters.employmentType !== undefined ? 1 : prev.page),
    }));
  };

  return {
    customers,
    pagination,
    loading,
    error,
    filters,
    updateFilters,
    refetch: fetchCustomers,
  };
}

/**
 * Hook to fetch single customer detail by ID
 */
export function useCustomer(id) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomer = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/customers/${id}`);
      setCustomer(response.data);
    } catch (err) {
      console.error(`Error fetching customer ${id}:`, err);
      setError(err.message || 'Failed to fetch customer details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  return {
    customer,
    loading,
    error,
    refetch: fetchCustomer,
  };
}

/**
 * Hook to create a customer
 */
export function useCreateCustomer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createCustomer = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/customers', data);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error creating customer:', err);
      setError(err);
      return {
        success: false,
        error: err,
        status: err.status,
        data: err.data,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    createCustomer,
    loading,
    error,
  };
}
