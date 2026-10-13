import { z } from 'zod';
import { emailField, newPasswordField } from '@ui/screens/schemaFields';

export const signUpSchema = z.object({
  name: z.string().trim().min(1, 'Informe seu nome').max(100),
  email: emailField,
  password: newPasswordField,
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
