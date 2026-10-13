import { z } from 'zod';
import { emailField } from '#application/controllers/auth/schemas/fields';

export const emailOnlySchema = z.object({
  email: emailField,
});

export type EmailOnlyBody = z.infer<typeof emailOnlySchema>;
