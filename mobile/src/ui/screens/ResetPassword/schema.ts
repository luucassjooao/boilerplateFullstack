import { z } from 'zod';
import { codeField, newPasswordField } from '@ui/screens/schemaFields';

export const resetPasswordSchema = z.object({
  code: codeField,
  password: newPasswordField,
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
