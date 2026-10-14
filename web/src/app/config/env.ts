import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.url(),
});

/** Validated at startup: a missing variable fails fast instead of producing broken requests. */
export const env = envSchema.parse(import.meta.env);
