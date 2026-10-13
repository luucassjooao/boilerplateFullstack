import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@app/config/env';
import { accessTokenStore } from '@app/lib/accessTokenStore';

type RetriableRequestConfig = InternalAxiosRequestConfig & { retried?: boolean };

const REFRESH_URL = '/auth/refresh';

// Module state (not static fields): a `this.x = ...` inside a static method called through a
// subclass would create a separate copy per subclass and break the single flight.
let refreshPromise: Promise<string> | null = null;
let sessionExpiredListener: (() => void) | null = null;

async function requestNewAccessToken(): Promise<string> {
  const { data } = await Service.http.post<{ accessToken: string }>(REFRESH_URL);

  accessTokenStore.set(data.accessToken);

  return data.accessToken;
}

/**
 * Base of every service: one axios instance with credentials (refresh cookie), the platform header,
 * the bearer token and transparent token refresh.
 */
export class Service {
  static readonly http = axios.create({
    baseURL: env.VITE_API_URL,
    withCredentials: true,
    headers: { 'X-Client-Platform': 'web' },
  });

  protected static get client() {
    return Service.http;
  }

  /**
   * Single flight: concurrent callers share one refresh. Across tabs, refreshes are serialized
   * with the Web Locks API, so two tabs never send the same (rotating) refresh cookie at once.
   */
  static refreshAccessToken(): Promise<string> {
    refreshPromise ??= (
      navigator.locks
        ? navigator.locks.request('auth-refresh', requestNewAccessToken)
        : requestNewAccessToken()
    ).finally(() => {
      refreshPromise = null;
    });

    return refreshPromise;
  }

  /** Called when a refresh fails while retrying a request. Returns an unsubscribe function. */
  static onSessionExpired(listener: () => void): () => void {
    sessionExpiredListener = listener;

    return () => {
      if (sessionExpiredListener === listener) {
        sessionExpiredListener = null;
      }
    };
  }
}

Service.http.interceptors.request.use((config) => {
  const token = accessTokenStore.get();

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

Service.http.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetriableRequestConfig | undefined;
  const shouldRefresh = error.response?.status === 401
    && config
    && !config.retried
    && config.url !== REFRESH_URL
    // Only authenticated requests: a 401 from sign-in means wrong credentials, not an expired token.
    && Boolean(config.headers.Authorization);

  if (!shouldRefresh) {
    throw error;
  }

  config.retried = true;

  let token: string;

  try {
    token = await Service.refreshAccessToken();
  } catch {
    accessTokenStore.clear();
    sessionExpiredListener?.();
    throw error;
  }

  config.headers.Authorization = `Bearer ${token}`;

  return Service.http(config);
});
