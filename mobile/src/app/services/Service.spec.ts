import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { AuthTokensManager } from '@app/lib/AuthTokensManager';
import { AccountsService } from '@app/services/AccountsService';
import { AuthService } from '@app/services/AuthService';
import { Service } from '@app/services/Service';

type Reply = { status: number; data?: unknown };

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
    refreshCalls: () => calls.filter((config) => config.url === '/auth/refresh'),
  };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 10));

describe('Service (axios interceptors)', () => {
  const originalAdapter = Service.http.defaults.adapter;
  let unsubscribe: () => void = () => {};

  beforeEach(async () => {
    await AuthTokensManager.save({ accessToken: 'expired-access', refreshToken: 'refresh-1' });
  });

  afterEach(async () => {
    Service.http.defaults.adapter = originalAdapter;
    unsubscribe();
    await AuthTokensManager.clear();
  });

  it('3 concurrent 401s trigger exactly one refresh, persist the rotated token and retry once each', async () => {
    const api = mockApi(async (config) => {
      if (config.url === '/auth/refresh') {
        await tick();

        return { status: 200, data: { accessToken: 'fresh-access', refreshToken: 'refresh-2' } };
      }

      return config.headers.Authorization === 'Bearer fresh-access' ? { status: 200, data: { ok: true } } : { status: 401 };
    });

    const results = await Promise.all([Service.http.get('/a'), Service.http.get('/b'), AccountsService.me()]);

    expect(api.refreshCalls()).toHaveLength(1);
    expect(JSON.parse(api.refreshCalls()[0]!.data)).toEqual({ refreshToken: 'refresh-1' });
    expect(results).toHaveLength(3);
    expect(AuthTokensManager.getAccessToken()).toBe('fresh-access');
    await expect(AuthTokensManager.getRefreshToken()).resolves.toBe('refresh-2');
  });

  it('when the refresh fails: one refresh, tokens cleared, session expired', async () => {
    const onExpired = jest.fn();
    unsubscribe = Service.onSessionExpired(onExpired);
    const api = mockApi(async (config) => {
      if (config.url === '/auth/refresh') {
        await tick();
      }

      return { status: 401 };
    });

    const results = await Promise.allSettled([Service.http.get('/a'), Service.http.get('/b')]);

    expect(results.every((result) => result.status === 'rejected')).toBe(true);
    expect(api.refreshCalls()).toHaveLength(1);
    expect(onExpired).toHaveBeenCalled();
    expect(AuthTokensManager.getAccessToken()).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  });

  it('does not refresh for unauthenticated requests (wrong password on sign-in)', async () => {
    await AuthTokensManager.clear();
    const api = mockApi(() => ({ status: 401 }));

    await expect(AuthService.signIn({ email: 'a@b.c', password: 'x' })).rejects.toBeInstanceOf(AxiosError);
    expect(api.refreshCalls()).toHaveLength(0);
  });

  it('refresh without a stored token fails without calling the API', async () => {
    await AuthTokensManager.clear();
    const api = mockApi(() => ({ status: 200 }));

    await expect(AuthService.refresh()).rejects.toThrow('No refresh token stored');
    expect(api.calls).toHaveLength(0);
  });

  it('sends the mobile platform header and the bearer token', async () => {
    const api = mockApi(() => ({ status: 200, data: {} }));

    await Service.http.get('/me');

    expect(api.calls[0]?.headers['X-Client-Platform']).toBe('mobile');
    expect(api.calls[0]?.headers.Authorization).toBe('Bearer expired-access');
  });
});
