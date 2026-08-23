import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  setAuth: (user, accessToken) => {
    set({ user, accessToken, isLoading: false });
  },

  clearAuth: () => {
    set({ user: null, accessToken: null, isLoading: false });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  isRole: (...roles) => {
    const currentUser = get().user;
    if (!currentUser || !currentUser.role) return false;
    return roles.includes(currentUser.role);
  },
}));
