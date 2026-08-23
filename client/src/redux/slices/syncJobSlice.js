import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

/**
 * Fetch paginated & filtered CBS sync jobs
 */
export const fetchSyncJobs = createAsyncThunk(
  'syncJob/fetchSyncJobs',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/sync-jobs${queryStr}`);
      return {
        jobs: response.data || [],
        pagination: response.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
      };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch sync jobs');
    }
  }
);

/**
 * Fetch CBS sync stats
 */
export const fetchSyncStats = createAsyncThunk(
  'syncJob/fetchSyncStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/sync-jobs/stats');
      return (
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
      return rejectWithValue(err.message || 'Failed to fetch CBS stats');
    }
  }
);

/**
 * Fetch single sync job detail
 */
export const fetchSyncJobDetail = createAsyncThunk(
  'syncJob/fetchSyncJobDetail',
  async (applicationId, { rejectWithValue }) => {
    try {
      if (!applicationId) return null;
      const response = await api.get(`/sync-jobs/${applicationId}`);
      return response.data || null;
    } catch (err) {
      if (
        err.status === 404 ||
        err.data?.statusCode === 404 ||
        (err.message && err.message.toLowerCase().includes('not found'))
      ) {
        return null;
      }
      return rejectWithValue(err.message || 'Failed to fetch sync job detail');
    }
  }
);

/**
 * Retry a sync job
 */
export const retrySyncJob = createAsyncThunk(
  'syncJob/retrySyncJob',
  async (applicationId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/sync-jobs/${applicationId}/retry`);
      return { applicationId, message: response.message };
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Manual retry failed';
      return rejectWithValue(errMsg);
    }
  }
);

const initialState = {
  jobs: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  },
  stats: {
    total: 0,
    success: 0,
    pending: 0,
    inProgress: 0,
    failed: 0,
    exhausted: 0,
  },
  currentJob: null,
  filters: {
    status: '',
    page: 1,
    limit: 20,
  },
  loading: false,
  statsLoading: false,
  detailLoading: false,
  retryLoading: false,
  error: null,
};

const syncJobSlice = createSlice({
  name: 'syncJob',
  initialState,
  reducers: {
    setSyncJobFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
        page: action.payload.page !== undefined ? action.payload.page : 1,
      };
    },
    clearSyncJobDetail: (state) => {
      state.currentJob = null;
      state.detailLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchSyncJobs
      .addCase(fetchSyncJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSyncJobs.fulfilled, (state, action) => {
        state.jobs = action.payload.jobs;
        state.pagination = action.payload.pagination;
        state.loading = false;
      })
      .addCase(fetchSyncJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch sync jobs';
      })
      // fetchSyncStats
      .addCase(fetchSyncStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchSyncStats.fulfilled, (state, action) => {
        state.stats = action.payload;
        state.statsLoading = false;
      })
      .addCase(fetchSyncStats.rejected, (state, action) => {
        state.statsLoading = false;
      })
      // fetchSyncJobDetail
      .addCase(fetchSyncJobDetail.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchSyncJobDetail.fulfilled, (state, action) => {
        state.currentJob = action.payload;
        state.detailLoading = false;
      })
      .addCase(fetchSyncJobDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })
      // retrySyncJob
      .addCase(retrySyncJob.pending, (state) => {
        state.retryLoading = true;
        state.error = null;
      })
      .addCase(retrySyncJob.fulfilled, (state) => {
        state.retryLoading = false;
      })
      .addCase(retrySyncJob.rejected, (state, action) => {
        state.retryLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setSyncJobFilters, clearSyncJobDetail } = syncJobSlice.actions;

// Selectors
export const selectSyncJobs = (state) => state.syncJobs.jobs;
export const selectSyncJobsPagination = (state) => state.syncJobs.pagination;
export const selectSyncJobStats = (state) => state.syncJobs.stats;
export const selectCurrentSyncJob = (state) => state.syncJobs.currentJob;
export const selectSyncJobFilters = (state) => state.syncJobs.filters;
export const selectSyncJobsLoading = (state) => state.syncJobs.loading;
export const selectSyncStatsLoading = (state) => state.syncJobs.statsLoading;
export const selectSyncJobDetailLoading = (state) => state.syncJobs.detailLoading;
export const selectSyncRetryLoading = (state) => state.syncJobs.retryLoading;
export const selectSyncJobsError = (state) => state.syncJobs.error;

export default syncJobSlice.reducer;
