import { z } from 'zod';
import { codeField, emailField, passwordField } from '#application/controllers/auth/schemas/fields';

export const resetPasswordSchema = z.object({
  email: emailField,
  code: codeField,
  password: passwordField,
});

export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;
