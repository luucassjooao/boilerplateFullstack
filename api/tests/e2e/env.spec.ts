import { describe, expect, it } from 'vitest';
import { loadEnv } from '#main/config/env';
import { testEnv } from '#tests/makeTestApp';

describe('loadEnv', () => {
  it('fails fast on invalid variables', () => {
    expect(() => loadEnv({ ...testEnv, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
    expect(() => loadEnv({ ...testEnv, WEB_ORIGINS: 'not-a-url' })).toThrow(/WEB_ORIGINS/);
  });

  it('parses lists and defaults', () => {
    const env = loadEnv({ ...testEnv, WEB_ORIGINS: 'http://a.test, http://b.test' });

    expect(env.WEB_ORIGINS).toEqual(['http://a.test', 'http://b.test']);
    expect(env.PORT).toBe(3333);
    expect(env.TRUST_PROXY).toBe(false);
  });
});
