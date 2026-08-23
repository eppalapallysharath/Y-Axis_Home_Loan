import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

/**
 * Fetch activity logs for an application
 */
export const fetchActivityLogs = createAsyncThunk(
  'activityLog/fetchActivityLogs',
  async ({ appId, page = 1, limit = 20, actions = [], append = false }, { rejectWithValue }) => {
    try {
      if (!appId) return { data: [], pagination: {}, append: false };

      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (actions && actions.length > 0) {
        params.append('actions', actions.join(','));
      }

      const res = await api.get(`/applications/${appId}/activity?${params.toString()}`);
      return {
        logs: res.data || [],
        pagination: res.pagination || { total: 0, page, limit, totalPages: 1 },
        append,
      };
    } catch (err) {
      return rejectWithValue(err.data?.message || err.message || 'Failed to fetch activity logs.');
    }
  }
);

/**
 * Add a manual note
 */
export const addNote = createAsyncThunk(
  'activityLog/addNote',
  async ({ appId, noteText }, { rejectWithValue }) => {
    try {
      if (!noteText || !noteText.trim()) {
        return rejectWithValue('Note text cannot be empty.');
      }
      const res = await api.post(`/applications/${appId}/notes`, { noteText: noteText.trim() });
      return { data: res.data, message: res.message || 'Note added successfully' };
    } catch (err) {
      return rejectWithValue(err.data?.message || err.message || 'Failed to add note.');
    }
  }
);

const initialState = {
  logs: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  },
  actionsFilter: [],
  loading: false,
  loadingMore: false,
  actionLoading: false,
  error: null,
};

const activityLogSlice = createSlice({
  name: 'activityLog',
  initialState,
  reducers: {
    setActionsFilter: (state, action) => {
      state.actionsFilter = action.payload || [];
    },
    clearActivityLogs: (state) => {
      state.logs = [];
      state.pagination = initialState.pagination;
      state.actionsFilter = [];
      state.loading = false;
      state.loadingMore = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchActivityLogs
      .addCase(fetchActivityLogs.pending, (state, action) => {
        if (action.meta.arg.append) {
          state.loadingMore = true;
        } else {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        if (action.payload.append) {
          state.logs = [...state.logs, ...(action.payload.logs || [])];
        } else {
          state.logs = action.payload.logs || [];
        }
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchActivityLogs.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload;
      })
      // addNote
      .addCase(addNote.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(addNote.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.data) {
          state.logs.unshift(action.payload.data);
          state.pagination.total += 1;
        }
      })
      .addCase(addNote.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setActionsFilter, clearActivityLogs } = activityLogSlice.actions;

// Selectors
export const selectActivityLogs = (state) => state.activityLogs.logs;
export const selectActivityPagination = (state) => state.activityLogs.pagination;
export const selectActivityActionsFilter = (state) => state.activityLogs.actionsFilter;
export const selectActivityLoading = (state) => state.activityLogs.loading;
export const selectActivityLoadingMore = (state) => state.activityLogs.loadingMore;
export const selectActivityActionLoading = (state) => state.activityLogs.actionLoading;
export const selectActivityError = (state) => state.activityLogs.error;

export default activityLogSlice.reducer;
