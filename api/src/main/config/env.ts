import { z } from 'zod';

const list = z
  .string()
  .transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean));

const optionalList = list.optional().transform((value) => value ?? []);

const secret = z
  .string()
  .refine((value) => Buffer.byteLength(value) >= 32, 'must have at least 32 bytes');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3333),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  TRUST_PROXY: z.stringbool().default(false),
  WEB_ORIGINS: list.pipe(z.array(z.url()).min(1)),
  COOKIE_SECRET: secret,
  JWT_SECRET: secret,
  JWT_ISSUER: z.string().min(1).default('api'),
  JWT_AUDIENCE: z.string().min(1).default('app'),
  // Secure cookies need HTTPS; only turn off for http://localhost.
  COOKIE_SECURE: z.stringbool().default(true),
  DATABASE_URL: z.url(),
  CODE_HASH_SECRET: secret,
  EMAIL_PROVIDER: z.enum(['console', 'resend']).default('console'),
  EMAIL_FROM: z.string().min(1).default('App <onboarding@resend.dev>'),
  RESEND_API_KEY: z.string().min(1).optional(),
  // Public URLs: OAuth redirect_uri is built from API_URL; OAuth callbacks land on WEB_URL/auth/callback.
  API_URL: z.url().default('http://localhost:3333'),
  WEB_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_MOBILE_CLIENT_IDS: optionalList,
  APPLE_SERVICES_ID: z.string().min(1).optional(),
  APPLE_TEAM_ID: z.string().min(1).optional(),
  APPLE_KEY_ID: z.string().min(1).optional(),
  // PEM of the .p8 key; "\n" escapes are accepted so it fits in one line.
  APPLE_PRIVATE_KEY: z.string().min(1).optional().transform((value) => value?.replaceAll('\\n', '\n')),
  APPLE_BUNDLE_IDS: optionalList,
}).superRefine((env, ctx) => {
  if (env.EMAIL_PROVIDER === 'resend' && !env.RESEND_API_KEY) {
    ctx.addIssue({ code: 'custom', path: ['RESEND_API_KEY'], message: 'required when EMAIL_PROVIDER=resend' });
  }

  // Each provider is enabled by setting all of its variables, or disabled by setting none.
  const groups = {
    google: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    apple: ['APPLE_SERVICES_ID', 'APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY'],
  } as const;

  for (const keys of Object.values(groups)) {
    const missing = keys.filter((key) => !env[key]);

    if (missing.length > 0 && missing.length < keys.length) {
      for (const key of missing) {
        ctx.addIssue({ code: 'custom', path: [key], message: `required together with ${keys.join(', ')}` });
      }
    }
  }
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  // `KEY=` in a .env file means "not set".
  const defined = Object.fromEntries(Object.entries(source).filter(([, value]) => value !== ''));
  const result = envSchema.safeParse(defined);

  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }

  return result.data;
}
