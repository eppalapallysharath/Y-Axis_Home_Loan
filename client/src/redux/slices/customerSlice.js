import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

/**
 * Fetch paginated customers list
 */
export const fetchCustomers = createAsyncThunk(
  'customer/fetchCustomers',
  async (filters = {}, { rejectWithValue }) => {
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
      return {
        customers: response.data || [],
        pagination: response.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
      };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch customers');
    }
  }
);

/**
 * Fetch single customer detail by ID
 */
export const fetchCustomerById = createAsyncThunk(
  'customer/fetchCustomerById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/customers/${id}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message || `Failed to fetch customer #${id}`);
    }
  }
);

/**
 * Create a new customer
 */
export const createCustomer = createAsyncThunk(
  'customer/createCustomer',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/customers', data);
      return response.data;
    } catch (err) {
      return rejectWithValue({
        message: err.message || err.data?.message || 'Failed to create customer',
        status: err.status,
        data: err.data,
      });
    }
  }
);

const initialState = {
  customers: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  },
  currentCustomer: null,
  filters: {
    search: '',
    employmentType: '',
    fromDate: '',
    toDate: '',
    page: 1,
    limit: 20,
  },
  loading: false,
  detailLoading: false,
  actionLoading: false,
  error: null,
};

const customerSlice = createSlice({
  name: 'customer',
  initialState,
  reducers: {
    setCustomerFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
        page: action.payload.page !== undefined ? action.payload.page : 1,
      };
    },
    resetCustomerFilters: (state) => {
      state.filters = initialState.filters;
    },
    setCurrentCustomer: (state, action) => {
      state.currentCustomer = action.payload;
    },
    clearCurrentCustomer: (state) => {
      state.currentCustomer = null;
      state.detailLoading = false;
      state.error = null;
    },
    clearCustomerError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCustomers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.customers = action.payload.customers;
        state.pagination = action.payload.pagination;
        state.loading = false;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch customers';
      })
      // fetchCustomerById
      .addCase(fetchCustomerById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.currentCustomer = action.payload;
        state.detailLoading = false;
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload || 'Failed to fetch customer';
      })
      // createCustomer
      .addCase(createCustomer.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.customers.unshift(action.payload);
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setCustomerFilters,
  resetCustomerFilters,
  setCurrentCustomer,
  clearCurrentCustomer,
  clearCustomerError,
} = customerSlice.actions;

// Selectors
export const selectCustomers = (state) => state.customer.customers;
export const selectCustomerPagination = (state) => state.customer.pagination;
export const selectCurrentCustomer = (state) => state.customer.currentCustomer;
export const selectCustomerFilters = (state) => state.customer.filters;
export const selectCustomersLoading = (state) => state.customer.loading;
export const selectCustomerDetailLoading = (state) => state.customer.detailLoading;
export const selectCustomerActionLoading = (state) => state.customer.actionLoading;
export const selectCustomerError = (state) => state.customer.error;

export default customerSlice.reducer;
