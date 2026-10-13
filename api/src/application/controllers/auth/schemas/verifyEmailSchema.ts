import { z } from 'zod';
import { codeField, emailField } from '#application/controllers/auth/schemas/fields';

export const verifyEmailSchema = z.object({
  email: emailField,
  code: codeField,
});

export type VerifyEmailBody = z.infer<typeof verifyEmailSchema>;
