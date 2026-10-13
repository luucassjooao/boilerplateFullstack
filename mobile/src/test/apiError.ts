import { AxiosError, type AxiosResponse } from 'axios';

/** An axios error shaped like the API error envelope. */
export function apiError(status: number, code: string) {
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
    status,
    data: { error: { code, message: code } },
  } as AxiosResponse);
}
