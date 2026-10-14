import { z } from 'zod';
import { emailField } from '@ui/screens/schemaFields';

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
