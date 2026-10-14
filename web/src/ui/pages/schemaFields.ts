import { z } from 'zod';

export const emailField = z.string().trim().pipe(z.email('Informe um email válido'));

export const newPasswordField = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres')
  .max(128, 'A senha pode ter no máximo 128 caracteres');

export const codeField = z.string().trim().regex(/^\d{6}$/, 'O código tem 6 dígitos');
