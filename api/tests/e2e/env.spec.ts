import { describe, expect, it } from 'vitest';
import { loadEnv } from '#main/config/env';
import { testEnv } from '#tests/makeTestApp';

describe('loadEnv', () => {
  it('fails fast on invalid variables', () => {
    expect(() => loadEnv({ ...testEnv, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
    expect(() => loadEnv({ ...testEnv, WEB_ORIGINS: 'not-a-url' })).toThrow(/WEB_ORIGINS/);
  });

  it('requires all variables of an OAuth provider together', () => {
    expect(() => loadEnv({ ...testEnv, GOOGLE_CLIENT_ID: 'id' })).toThrow(/GOOGLE_CLIENT_SECRET/);
    expect(() => loadEnv({ ...testEnv, APPLE_SERVICES_ID: 'com.x', APPLE_TEAM_ID: 'T' })).toThrow(/APPLE_KEY_ID/);
    expect(loadEnv({ ...testEnv, GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret' }).GOOGLE_CLIENT_ID).toBe('id');
  });

  it('requires RESEND_API_KEY for the resend provider and treats empty values as unset', () => {
    expect(() => loadEnv({ ...testEnv, EMAIL_PROVIDER: 'resend', RESEND_API_KEY: '' })).toThrow(/RESEND_API_KEY/);
  });

  it('unescapes \\n in APPLE_PRIVATE_KEY', () => {
    const env = loadEnv({
      ...testEnv,
      APPLE_SERVICES_ID: 's',
      APPLE_TEAM_ID: 't',
      APPLE_KEY_ID: 'k',
      APPLE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----',
    });

    expect(env.APPLE_PRIVATE_KEY).toBe('-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----');
  });

  it('parses lists and defaults', () => {
    const env = loadEnv({ ...testEnv, WEB_ORIGINS: 'http://a.test, http://b.test' });

    expect(env.WEB_ORIGINS).toEqual(['http://a.test', 'http://b.test']);
    expect(env.PORT).toBe(3333);
    expect(env.TRUST_PROXY).toBe(false);
  });
});
