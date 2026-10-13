import { z } from 'zod';

/** Mobile sends the token in the body; web sends it in the httpOnly cookie. */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1).max(512).optional(),
});

export type RefreshTokenBody = z.infer<typeof refreshTokenSchema>;
