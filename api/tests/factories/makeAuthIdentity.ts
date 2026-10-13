import { randomUUID } from 'node:crypto';
import { AuthIdentity } from '#application/entities/AuthIdentity';

export function makeAuthIdentity(override: Partial<AuthIdentity.Attributes> & { userId: string }): AuthIdentity {
  return new AuthIdentity({
    provider: 'google',
    providerUserId: randomUUID(),
    email: null,
    ...override,
  });
}
