import { z } from 'zod';
import { codeField, emailField } from '@ui/pages/schemaFields';

export const verifyEmailSchema = z.object({
  email: emailField,
  code: codeField,
});

export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;
