import { z } from 'zod';

export const emailField = z.string().trim().pipe(z.email().max(254));

/** Upper bound protects the password hasher against huge inputs (DoS). */
export const passwordField = z.string().min(8).max(128);

export const codeField = z.string().trim().regex(/^\d{6}$/, 'must have 6 digits');
