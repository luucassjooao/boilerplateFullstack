import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { accessTokenStore } from '@app/lib/accessTokenStore';
import { AccountsService } from '@app/services/AccountsService';
import { AuthService } from '@app/services/AuthService';
import { Service } from '@app/services/Service';

type Reply = { status: number; data?: unknown };

/** Replaces the HTTP layer of the shared axios instance. */
function mockApi(handler: (config: InternalAxiosRequestConfig) => Reply | Promise<Reply>) {
  const calls: InternalAxiosRequestConfig[] = [];

  Service.http.defaults.adapter = async (config) => {
    calls.push(config);

    const { status, data } = await handler(config);
    const response = { data, status, statusText: '', headers: {}, config } as AxiosResponse;

    if (status >= 400) {
      throw new AxiosError(`HTTP ${status}`, 'ERR_BAD_RESPONSE', config, undefined, response);
    }

    return response;
  };

  return {
    calls,
    refreshCalls: () => calls.filter((config) => config.url === '/auth/refresh').length,
  };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 10));

describe('Service (axios interceptors)', () => {
  const originalAdapter = Service.http.defaults.adapter;
  let unsubscribe: () => void = () => {};

  beforeEach(() => {
    accessTokenStore.set('expired-token');
  });

  afterEach(() => {
    Service.http.defaults.adapter = originalAdapter;
    accessTokenStore.clear();
    unsubscribe();
    vi.unstubAllGlobals();
  });

  it('3 concurrent 401s trigger exactly one refresh and every request is retried once', async () => {
    const api = mockApi(async (config) => {
      if (config.url === '/auth/refresh') {
        await tick();

        return { status: 200, data: { accessToken: 'fresh-token' } };
      }

      return config.headers.Authorization === 'Bearer fresh-token'
        ? { status: 200, data: { url: config.url } }
        : { status: 401 };
    });

    const results = await Promise.all([
      Service.http.get('/a'),
      Service.http.get('/b'),
      AccountsService.me(),
    ]);

    expect(api.refreshCalls()).toBe(1);
    expect(results.map((result) => ('data' in result ? result.data.url : result))).toEqual(['/a', '/b', { url: '/me' }]);
    expect(api.calls.filter((config) => config.url !== '/auth/refresh')).toHaveLength(6);
    expect(accessTokenStore.get()).toBe('fresh-token');
  });

  it('when the refresh fails: one refresh, session expired once per failed request, token cleared', async () => {
    const onExpired = vi.fn();
    unsubscribe = Service.onSessionExpired(onExpired);
    const api = mockApi(async (config) => {
      if (config.url === '/auth/refresh') {
        await tick();
      }

      return { status: 401 };
    });

    const results = await Promise.allSettled([Service.http.get('/a'), Service.http.get('/b')]);

    expect(results.every((result) => result.status === 'rejected')).toBe(true);
    expect(api.refreshCalls()).toBe(1);
    expect(onExpired).toHaveBeenCalled();
    expect(accessTokenStore.get()).toBeNull();
  });

  it('does not refresh for unauthenticated requests (e.g. wrong password on sign-in)', async () => {
    accessTokenStore.clear();
    const api = mockApi(() => ({ status: 401, data: { error: { code: 'INVALID_CREDENTIALS' } } }));

    await expect(AuthService.signIn({ email: 'a@b.c', password: 'x' })).rejects.toBeInstanceOf(AxiosError);
    expect(api.refreshCalls()).toBe(0);
  });

  it('does not retry the refresh route itself', async () => {
    const api = mockApi(() => ({ status: 401 }));

    await expect(AuthService.refresh()).rejects.toBeInstanceOf(AxiosError);
    expect(api.refreshCalls()).toBe(1);
  });

  it('retries a request only once', async () => {
    const api = mockApi((config) => (
      config.url === '/auth/refresh' ? { status: 200, data: { accessToken: 'fresh-token' } } : { status: 401 }
    ));

    await expect(Service.http.get('/a')).rejects.toBeInstanceOf(AxiosError);
    expect(api.calls.map((config) => config.url)).toEqual(['/a', '/auth/refresh', '/a']);
  });

  it('serializes refreshes across tabs with navigator.locks', async () => {
    const request = vi.fn((_name: string, callback: () => Promise<string>) => callback());
    vi.stubGlobal('navigator', { ...navigator, locks: { request } });
    mockApi(() => ({ status: 200, data: { accessToken: 'fresh-token' } }));

    await expect(AuthService.refresh()).resolves.toBe('fresh-token');
    expect(request).toHaveBeenCalledWith('auth-refresh', expect.any(Function));
  });

  it('sends the platform header, credentials and the bearer token', async () => {
    const api = mockApi(() => ({ status: 200, data: {} }));

    await Service.http.get('/me');

    const [config] = api.calls;

    expect(config?.headers['X-Client-Platform']).toBe('web');
    expect(config?.headers.Authorization).toBe('Bearer expired-token');
    expect(config?.withCredentials).toBe(true);
  });
});
