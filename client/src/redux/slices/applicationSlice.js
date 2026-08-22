import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  applications: [],
  currentApplication: null,
  loading: false,
  error: null,
};

const applicationSlice = createSlice({
  name: "application",
  initialState,
  reducers: {
    setApplications: (state, action) => {
      state.applications = action.payload;
      state.loading = false;
    },
    setCurrentApplication: (state, action) => {
      state.currentApplication = action.payload;
    },
    addApplication: (state, action) => {
      state.applications.unshift(action.payload);
    },
    setAppLoading: (state, action) => {
      state.loading = action.payload;
    },
    setAppError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setApplications,
  setCurrentApplication,
  addApplication,
  setAppLoading,
  setAppError,
} = applicationSlice.actions;
export default applicationSlice.reducer;
