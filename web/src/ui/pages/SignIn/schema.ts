import { z } from 'zod';
import { emailField } from '@ui/pages/schemaFields';

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Informe sua senha'),
});

export type SignInFormData = z.infer<typeof signInSchema>;
