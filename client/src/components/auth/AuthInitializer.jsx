'use client';

import { useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../redux/hooks';

export function AuthInitializer({ children }) {
  const { setAuth, clearAuth, setLoading } = useAuth();

  useEffect(() => {
    async function restoreSession() {
      // Check if any session cookie exists before making network request
      const hasSession =
        typeof document !== 'undefined' &&
        (document.cookie.includes('access_token=') ||
          document.cookie.includes('logged_in=true'));

      if (!hasSession) {
        clearAuth();
        setLoading(false);
        return;
      }

      try {
        const res = await api.post('/auth/refresh');
        const user = res.user || res.data?.user;
        const accessToken = res.accessToken || res.data?.accessToken;

        if (user && accessToken) {
          setAuth(user, accessToken);
          document.cookie = `access_token=${accessToken}; path=/; max-age=900; samesite=lax`;
          document.cookie = `logged_in=true; path=/; max-age=604800; samesite=lax`;
        } else {
          clearAuth();
          document.cookie = 'access_token=; path=/; max-age=0; samesite=lax';
          document.cookie = 'logged_in=; path=/; max-age=0; samesite=lax';
        }
      } catch (err) {
        clearAuth();
        document.cookie = 'access_token=; path=/; max-age=0; samesite=lax';
        document.cookie = 'logged_in=; path=/; max-age=0; samesite=lax';
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, [setAuth, clearAuth, setLoading]);

  return children;
}
