/** Same rule as the API: only same-origin relative paths ("/x", never "//x", "/\x" or control chars). */
// eslint-disable-next-line no-control-regex -- control characters are exactly what must be rejected.
const RELATIVE_PATH = /^\/(?![/\\])[^\\\u0000-\u001f]*$/;

export function safeRedirect(path: string | null | undefined, fallback = '/'): string {
  return path && RELATIVE_PATH.test(path) ? path : fallback;
}
