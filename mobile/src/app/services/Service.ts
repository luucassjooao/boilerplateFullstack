import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@app/config/env';
import { AuthTokensManager } from '@app/lib/AuthTokensManager';

type RetriableRequestConfig = InternalAxiosRequestConfig & { retried?: boolean };

const REFRESH_URL = '/auth/refresh';

// Module state (not static fields): a `this.x = ...` inside a static method called through a
// subclass would create a separate copy per subclass and break the single flight.
let refreshPromise: Promise<AuthTokensManager.Tokens> | null = null;
let sessionExpiredListener: (() => void) | null = null;

async function requestNewTokens(): Promise<AuthTokensManager.Tokens> {
  const refreshToken = await AuthTokensManager.getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token stored');
  }

  const { data } = await Service.http.post<AuthTokensManager.Tokens>(REFRESH_URL, { refreshToken });

  // Rotation: the old refresh token is now used; persist the new one before anyone refreshes again.
  await AuthTokensManager.save(data);

  return data;
}

/** Base of every service: one axios instance with the platform header, bearer token and transparent refresh. */
export class Service {
  static readonly http = axios.create({
    baseURL: env.EXPO_PUBLIC_API_URL,
    headers: { 'X-Client-Platform': 'mobile' },
  });

  protected static get client() {
    return Service.http;
  }

  /** Single flight: concurrent callers share one refresh request. */
  static refreshTokens(): Promise<AuthTokensManager.Tokens> {
    refreshPromise ??= requestNewTokens().finally(() => {
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
  const token = AuthTokensManager.getAccessToken();

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

  let tokens: AuthTokensManager.Tokens;

  try {
    tokens = await Service.refreshTokens();
  } catch {
    await AuthTokensManager.clear();
    sessionExpiredListener?.();
    throw error;
  }

  config.headers.Authorization = `Bearer ${tokens.accessToken}`;

  return Service.http(config);
});
