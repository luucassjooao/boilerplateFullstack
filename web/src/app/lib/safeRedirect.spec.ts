import { describe, expect, it } from 'vitest';
import { safeRedirect } from '@app/lib/safeRedirect';

describe('safeRedirect', () => {
  it.each(['/dashboard', '/a/b?c=1#d'])('keeps %j', (path) => {
    expect(safeRedirect(path)).toBe(path);
  });

  it.each([null, '', 'https://evil.com', '//evil.com', '/\\evil.com', '/\t/evil.com', 'javascript:alert(1)'])(
    'falls back for %j',
    (path) => {
      expect(safeRedirect(path)).toBe('/');
    },
  );
});
