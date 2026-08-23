import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

/**
 * Fetch work items for an application
 */
export const fetchWorkItems = createAsyncThunk(
  'workItem/fetchWorkItems',
  async (appId, { rejectWithValue }) => {
    try {
      if (!appId || isNaN(appId)) return [];
      const res = await api.get(`/applications/${appId}/work-items`);
      return res.data || [];
    } catch (err) {
      return rejectWithValue(err.message || `Failed to fetch work items for application #${appId}`);
    }
  }
);

/**
 * Create a new work item
 */
export const createWorkItem = createAsyncThunk(
  'workItem/createWorkItem',
  async ({ appId, payload }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/applications/${appId}/work-items`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue({
        message: err.data?.message || err.message || 'Failed to create work item',
        error: err,
      });
    }
  }
);

/**
 * Apply standard checklist (bulk creation)
 */
export const applyChecklist = createAsyncThunk(
  'workItem/applyChecklist',
  async (appId, { rejectWithValue }) => {
    try {
      const res = await api.post(`/applications/${appId}/work-items/bulk`);
      return { data: res.data, message: res.message };
    } catch (err) {
      return rejectWithValue({
        message: err.data?.message || err.message || 'Failed to apply standard checklist',
        error: err,
      });
    }
  }
);

/**
 * Update a work item
 */
export const updateWorkItem = createAsyncThunk(
  'workItem/updateWorkItem',
  async ({ appId, itemId, payload }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/applications/${appId}/work-items/${itemId}`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue({
        message: err.data?.message || err.message || 'Failed to update work item',
        error: err,
      });
    }
  }
);

/**
 * Delete a work item
 */
export const deleteWorkItem = createAsyncThunk(
  'workItem/deleteWorkItem',
  async ({ appId, itemId }, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/applications/${appId}/work-items/${itemId}`);
      return { itemId, message: res.message };
    } catch (err) {
      return rejectWithValue({
        message: err.data?.message || err.message || 'Failed to delete work item',
        error: err,
      });
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  actionLoading: false,
  error: null,
};

const workItemSlice = createSlice({
  name: 'workItem',
  initialState,
  reducers: {
    clearWorkItems: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
    setWorkItems: (state, action) => {
      state.items = action.payload || [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchWorkItems
      .addCase(fetchWorkItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkItems.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchWorkItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createWorkItem
      .addCase(createWorkItem.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createWorkItem.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items.push(action.payload);
      })
      .addCase(createWorkItem.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // applyChecklist
      .addCase(applyChecklist.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(applyChecklist.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (Array.isArray(action.payload.data)) {
          state.items = action.payload.data;
        }
      })
      .addCase(applyChecklist.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // updateWorkItem
      .addCase(updateWorkItem.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateWorkItem.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateWorkItem.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      // deleteWorkItem
      .addCase(deleteWorkItem.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteWorkItem.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.items = state.items.filter((item) => item.id !== action.payload.itemId);
      })
      .addCase(deleteWorkItem.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearWorkItems, setWorkItems } = workItemSlice.actions;

// Selectors
export const selectWorkItems = (state) => state.workItems.items;
export const selectWorkItemsLoading = (state) => state.workItems.loading;
export const selectWorkItemActionLoading = (state) => state.workItems.actionLoading;
export const selectWorkItemsError = (state) => state.workItems.error;

export default workItemSlice.reducer;
