import { z } from 'zod';
import { codeField, emailField, newPasswordField } from '@ui/pages/schemaFields';

export const resetPasswordSchema = z.object({
  email: emailField,
  code: codeField,
  password: newPasswordField,
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
