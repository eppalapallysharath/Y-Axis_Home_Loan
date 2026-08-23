let storeRef = null;

export const injectStore = (store) => {
  storeRef = store;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  refreshQueue = [];
};

/**
 * Set client cookie for SSR and Next.js Edge Middleware
 */
const setAccessTokenCookie = (token) => {
  if (typeof document !== 'undefined' && token) {
    document.cookie = `access_token=${token}; path=/; max-age=900; samesite=lax`;
  }
};

const clearAccessTokenCookie = () => {
  if (typeof document !== 'undefined') {
    document.cookie = 'access_token=; path=/; max-age=0; samesite=lax';
  }
};

/**
 * Get access token from Redux store if available
 */
const getAccessToken = () => {
  if (storeRef) {
    try {
      return storeRef.getState()?.auth?.accessToken || null;
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Custom fetch wrapper that handles Auth headers, credentials, and silent token refresh with queueing
 */
export async function apiFetch(endpoint, options = {}) {
  const token = getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include',
  };

  let response = await fetch(`${API_BASE}${endpoint}`, config);

  // Handle 401 Token Expiration (attempt silent refresh)
  if (response.status === 401 && !options._isRetry && !endpoint.includes('/auth/login')) {
    if (isRefreshing) {
      // Queue requests while token refresh is in flight
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          headers['Authorization'] = `Bearer ${newToken}`;
          return fetch(`${API_BASE}${endpoint}`, {
            ...config,
            headers,
            _isRetry: true,
          }).then((res) => res.json());
        })
        .catch((err) => {
          throw err;
        });
    }

    isRefreshing = true;

    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const user = refreshData.user || refreshData.data?.user;
        const newToken = refreshData.accessToken || refreshData.data?.accessToken;

        if (user && newToken) {
          if (storeRef) {
            storeRef.dispatch({
              type: 'auth/setAuth',
              payload: { user, accessToken: newToken },
            });
          }
          setAccessTokenCookie(newToken);

          processQueue(null, newToken);

          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(`${API_BASE}${endpoint}`, {
            ...config,
            headers,
            _isRetry: true,
          });
        } else {
          throw new Error('Refresh response payload invalid');
        }
      } else {
        throw new Error('Refresh failed');
      }
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      if (storeRef) {
        storeRef.dispatch({ type: 'auth/clearAuth' });
      }
      clearAccessTokenCookie();

      const PUBLIC_PATHS = ['/', '/login'];
      if (typeof window !== 'undefined' && !PUBLIC_PATHS.includes(window.location.pathname)) {
        window.location.href = '/login?reason=session_expired';
      }
    } finally {
      isRefreshing = false;
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'API request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint, options) => apiFetch(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) =>
    apiFetch(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint, body, options) =>
    apiFetch(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint, options) => apiFetch(endpoint, { ...options, method: 'DELETE' }),
};
