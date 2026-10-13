import { z } from 'zod';
import { emailField, passwordField } from '#application/controllers/auth/schemas/fields';

export const signUpSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: emailField,
  password: passwordField,
});

export type SignUpBody = z.infer<typeof signUpSchema>;
