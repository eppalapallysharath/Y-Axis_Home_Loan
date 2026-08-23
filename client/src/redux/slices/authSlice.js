import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

/**
 * Async thunk for logging in
 */
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const user = res.user || res.data?.user;
      const accessToken = res.accessToken || res.data?.accessToken;
      if (!user || !accessToken) {
        return rejectWithValue('Invalid response from server');
      }
      return { user, accessToken };
    } catch (err) {
      return rejectWithValue(err.message || 'Login failed');
    }
  }
);

/**
 * Async thunk for logging out
 */
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { dispatch }) => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      dispatch(clearAuth());
      if (typeof document !== 'undefined') {
        document.cookie = 'access_token=; path=/; max-age=0; samesite=lax';
        document.cookie = 'logged_in=; path=/; max-age=0; samesite=lax';
      }
    }
  }
);

/**
 * Async thunk for refreshing user session
 */
export const refreshSession = createAsyncThunk(
  'auth/refreshSession',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/refresh');
      const user = res.user || res.data?.user;
      const accessToken = res.accessToken || res.data?.accessToken;
      if (!user || !accessToken) {
        return rejectWithValue('No active session found');
      }
      return { user, accessToken };
    } catch (err) {
      return rejectWithValue(err.message || 'Session refresh failed');
    }
  }
);

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action) => {
      const payload = action.payload || {};
      state.user = payload.user || null;
      state.accessToken = payload.accessToken || payload.token || null;
      state.isAuthenticated = Boolean(payload.user && (payload.accessToken || payload.token));
      state.isLoading = false;
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.isLoading = Boolean(action.payload);
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error?.message;
      })
      // Refresh Session
      .addCase(refreshSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(refreshSession.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      });
  },
});

export const { setAuth, clearAuth, setLoading, setError } = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectIsRole = (...roles) => (state) => {
  const user = state.auth.user;
  if (!user || !user.role) return false;
  return roles.includes(user.role);
};

export default authSlice.reducer;
