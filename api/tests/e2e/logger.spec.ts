import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { makeLogger } from '#main/composition/infra';
import { makeTestConfig } from '#tests/makeTestApp';

describe('logger', () => {
  it('redacts secrets and strips query strings', () => {
    const lines: Record<string, any>[] = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        lines.push(JSON.parse(chunk.toString()));
        callback();
      },
    });
    const logger = makeLogger(makeTestConfig({ LOG_LEVEL: 'info' }), stream);

    logger.info({ body: { password: 'hunter2', refreshToken: 'rt', email: 'a@b.c' } }, 'payload');
    logger.info({ req: { method: 'GET', url: '/auth/oauth/google/callback?code=abc&state=xyz' } }, 'request');

    expect(lines[0]?.body).toEqual({ password: '[REDACTED]', refreshToken: '[REDACTED]', email: 'a@b.c' });
    expect(lines[1]?.req.url).toBe('/auth/oauth/google/callback');
    expect(JSON.stringify(lines)).not.toMatch(/hunter2|abc|xyz/);
  });
});
