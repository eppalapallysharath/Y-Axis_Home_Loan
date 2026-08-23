import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import applicationReducer from './slices/applicationSlice';
import customerReducer from './slices/customerSlice';
import workItemReducer from './slices/workItemSlice';
import activityLogReducer from './slices/activityLogSlice';
import syncJobReducer from './slices/syncJobSlice';
import { injectStore } from '../lib/api';

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      application: applicationReducer,
      customer: customerReducer,
      workItems: workItemReducer,
      activityLogs: activityLogReducer,
      syncJobs: syncJobReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
    devTools: process.env.NODE_ENV !== 'production',
  });

  injectStore(store);
  return store;
};

export default makeStore;
