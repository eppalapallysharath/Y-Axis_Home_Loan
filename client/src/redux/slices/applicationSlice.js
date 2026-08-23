import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

/**
 * Fetch paginated applications list
 */
export const fetchApplications = createAsyncThunk(
  'application/fetchApplications',
  async (filters = {}, { rejectWithValue }) => {
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
      return {
        applications: response.data || [],
        pagination: response.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
      };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch applications');
    }
  }
);

/**
 * Fetch single application detail by ID
 */
export const fetchApplicationById = createAsyncThunk(
  'application/fetchApplicationById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/applications/${id}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message || `Failed to fetch application #${id}`);
    }
  }
);

/**
 * Create a new loan application
 */
export const createApplication = createAsyncThunk(
  'application/createApplication',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/applications', data);
      return response.data;
    } catch (err) {
      return rejectWithValue({
        message: err.message || err.data?.message || 'Failed to create application',
        status: err.status,
        data: err.data,
      });
    }
  }
);

/**
 * Update an existing loan application
 */
export const updateApplication = createAsyncThunk(
  'application/updateApplication',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/applications/${id}`, data);
      return response.data;
    } catch (err) {
      return rejectWithValue({
        message: err.message || err.data?.message || 'Failed to update application',
        status: err.status,
        data: err.data,
      });
    }
  }
);

/**
 * Assign loan application to executive
 */
export const assignApplication = createAsyncThunk(
  'application/assignApplication',
  async ({ id, assignedToId }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/applications/${id}/assign`, { assignedToId });
      return response.data;
    } catch (err) {
      return rejectWithValue({
        message: err.message || err.data?.message || 'Failed to assign application',
        status: err.status,
        data: err.data,
      });
    }
  }
);

/**
 * Transition application workflow stage
 */
export const transitionStage = createAsyncThunk(
  'application/transitionStage',
  async ({ id, toStage, rejectionReason, updatedAt }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/applications/${id}/stage`, {
        toStage,
        rejectionReason,
        updatedAt,
      });
      return { data: response.data, message: response.message };
    } catch (err) {
      if (err.data?.error === 'WorkItemBlockingError') {
        const blocking = {
          message: err.data.message || err.message,
          blockingItems: err.data.blockingItems || [],
        };
        return rejectWithValue({
          isBlockingError: true,
          blockingError: blocking,
          message: err.data.message,
        });
      }
      return rejectWithValue({
        message: err.message || err.data?.message || 'Stage transition failed.',
        status: err.status,
        data: err.data,
      });
    }
  }
);

const initialState = {
  applications: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  },
  currentApplication: null,
  filters: {
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
  },
  loading: false,
  detailLoading: false,
  actionLoading: false,
  error: null,
  blockingError: null,
};

const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    setApplicationFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
        page: action.payload.page !== undefined ? action.payload.page : 1,
      };
    },
    resetApplicationFilters: (state) => {
      state.filters = initialState.filters;
    },
    setCurrentApplication: (state, action) => {
      state.currentApplication = action.payload;
    },
    clearCurrentApplication: (state) => {
      state.currentApplication = null;
      state.detailLoading = false;
      state.error = null;
    },
    clearBlockingError: (state) => {
      state.blockingError = null;
    },
    clearApplicationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchApplications
      .addCase(fetchApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.applications = action.payload.applications;
        state.pagination = action.payload.pagination;
        state.loading = false;
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch applications';
      })
      // fetchApplicationById
      .addCase(fetchApplicationById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchApplicationById.fulfilled, (state, action) => {
        state.currentApplication = action.payload;
        state.detailLoading = false;
      })
      .addCase(fetchApplicationById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload || 'Failed to fetch application';
      })
      // createApplication
      .addCase(createApplication.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createApplication.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.applications.unshift(action.payload);
      })
      .addCase(createApplication.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // updateApplication
      .addCase(updateApplication.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateApplication.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (state.currentApplication && state.currentApplication.id === action.payload.id) {
          state.currentApplication = { ...state.currentApplication, ...action.payload };
        }
        const index = state.applications.findIndex((app) => app.id === action.payload.id);
        if (index !== -1) {
          state.applications[index] = { ...state.applications[index], ...action.payload };
        }
      })
      .addCase(updateApplication.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // assignApplication
      .addCase(assignApplication.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(assignApplication.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (state.currentApplication && state.currentApplication.id === action.payload.id) {
          state.currentApplication = { ...state.currentApplication, ...action.payload };
        }
        const index = state.applications.findIndex((app) => app.id === action.payload.id);
        if (index !== -1) {
          state.applications[index] = { ...state.applications[index], ...action.payload };
        }
      })
      .addCase(assignApplication.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // transitionStage
      .addCase(transitionStage.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.blockingError = null;
      })
      .addCase(transitionStage.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload.data;
        if (state.currentApplication && state.currentApplication.id === updated.id) {
          state.currentApplication = { ...state.currentApplication, ...updated };
        }
        const index = state.applications.findIndex((app) => app.id === updated.id);
        if (index !== -1) {
          state.applications[index] = { ...state.applications[index], ...updated };
        }
      })
      .addCase(transitionStage.rejected, (state, action) => {
        state.actionLoading = false;
        if (action.payload?.isBlockingError) {
          state.blockingError = action.payload.blockingError;
        } else {
          state.error = action.payload;
        }
      });
  },
});

export const {
  setApplicationFilters,
  resetApplicationFilters,
  setCurrentApplication,
  clearCurrentApplication,
  clearBlockingError,
  clearApplicationError,
} = applicationSlice.actions;

// Selectors
export const selectApplications = (state) => state.application.applications;
export const selectApplicationPagination = (state) => state.application.pagination;
export const selectCurrentApplication = (state) => state.application.currentApplication;
export const selectApplicationFilters = (state) => state.application.filters;
export const selectApplicationsLoading = (state) => state.application.loading;
export const selectApplicationDetailLoading = (state) => state.application.detailLoading;
export const selectApplicationActionLoading = (state) => state.application.actionLoading;
export const selectApplicationError = (state) => state.application.error;
export const selectBlockingError = (state) => state.application.blockingError;

export default applicationSlice.reducer;
