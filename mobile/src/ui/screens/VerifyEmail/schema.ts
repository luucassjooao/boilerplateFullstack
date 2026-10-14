import { z } from 'zod';
import { codeField } from '@ui/screens/schemaFields';

export const verifyEmailSchema = z.object({
  code: codeField,
});

export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;
