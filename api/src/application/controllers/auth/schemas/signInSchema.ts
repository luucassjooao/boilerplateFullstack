import { z } from 'zod';
import { emailField } from '#application/controllers/auth/schemas/fields';

export const signInSchema = z.object({
  email: emailField,
  // No min length here: rules may change, old passwords must still be able to sign in.
  password: z.string().min(1).max(128),
});

export type SignInBody = z.infer<typeof signInSchema>;
