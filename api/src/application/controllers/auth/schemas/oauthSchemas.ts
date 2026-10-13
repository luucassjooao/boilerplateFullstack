import { z } from 'zod';

/**
 * Only same-origin relative paths: starts with "/", not "//" or "/\", no backslashes or control
 * characters (browsers strip tabs/newlines, turning "/\t/evil.com" into "//evil.com").
 */
export const redirectToField = z
  .string()
  .max(2048)
  // eslint-disable-next-line no-control-regex -- control characters are exactly what must be rejected.
  .regex(/^\/(?![/\\])[^\\\u0000-\u001f]*$/, 'must be a relative path')
  .default('/');

export const authorizeQuerySchema = z.object({
  redirectTo: redirectToField,
});

export const oauthTokenSchema = z.object({
  idToken: z.string().min(1).max(8192),
  nonce: z.string().min(1).max(512).optional(),
  name: z.string().trim().max(100).optional(),
});

export type OAuthTokenBody = z.infer<typeof oauthTokenSchema>;

export const oauthTransactionSchema = z.object({
  provider: z.enum(['google', 'apple']),
  state: z.string(),
  codeVerifier: z.string(),
  nonce: z.string(),
  redirectTo: redirectToField,
});
