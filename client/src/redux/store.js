import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import applicationReducer from "./slices/applicationSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      application: applicationReducer,
    },
    devTools: process.env.NODE_ENV !== "production",
  });
};
