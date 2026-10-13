import type { Controller } from '#application/contracts/Controller';

export function userAgent(headers: Controller.Request['headers']): string | null {
  return headers['user-agent']?.slice(0, 512) ?? null;
}
