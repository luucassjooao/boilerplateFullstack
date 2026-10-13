import { randomUUID } from 'node:crypto';
import { User } from '#application/entities/User';

export function makeUser(override: Partial<User.Attributes> = {}): User {
  return new User({
    name: 'Ada Lovelace',
    email: `ada-${randomUUID()}@example.com`,
    emailVerifiedAt: new Date(),
    passwordHash: 'hashed:correct-password',
    ...override,
  });
}
