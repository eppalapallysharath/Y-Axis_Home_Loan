'use client';

import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
  setAuth as setAuthAction,
  clearAuth as clearAuthAction,
  setLoading as setLoadingAction,
  loginUser,
  logoutUser,
  refreshSession,
  selectUser,
  selectAccessToken,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
} from './slices/authSlice';

// Typed / helper dispatch and selector hooks
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

/**
 * Idiomatic React-Redux hook for Authentication & User Roles
 */
export function useAuth() {
  const dispatch = useAppDispatch();

  const user = useAppSelector(selectUser);
  const accessToken = useAppSelector(selectAccessToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  const isRole = useCallback(
    (...roles) => {
      if (!user || !user.role) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const setAuth = useCallback(
    (user, accessToken) => {
      dispatch(setAuthAction({ user, accessToken }));
    },
    [dispatch]
  );

  const clearAuth = useCallback(() => {
    dispatch(clearAuthAction());
  }, [dispatch]);

  const setLoading = useCallback(
    (isLoading) => {
      dispatch(setLoadingAction(isLoading));
    },
    [dispatch]
  );

  const login = useCallback(
    (credentials) => {
      return dispatch(loginUser(credentials));
    },
    [dispatch]
  );

  const logout = useCallback(() => {
    return dispatch(logoutUser());
  }, [dispatch]);

  const refresh = useCallback(() => {
    return dispatch(refreshSession());
  }, [dispatch]);

  return {
    user,
    accessToken,
    token: accessToken,
    isAuthenticated,
    isLoading,
    error,
    isRole,
    setAuth,
    clearAuth,
    setLoading,
    login,
    logout,
    refresh,
  };
}
