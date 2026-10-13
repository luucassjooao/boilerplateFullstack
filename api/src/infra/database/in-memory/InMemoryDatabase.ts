import { AuthIdentity } from '#application/entities/AuthIdentity';
import { RefreshToken } from '#application/entities/RefreshToken';
import { User } from '#application/entities/User';
import { VerificationCode } from '#application/entities/VerificationCode';

/**
 * Shared state of the in-memory repositories, so cascades and cross-aggregate writes behave like Postgres.
 * Entities are copied on the way in and out: a use case that forgets to call `update()` fails here too.
 */
export class InMemoryDatabase {
  users: User[] = [];
  authIdentities: AuthIdentity[] = [];
  refreshTokens: RefreshToken[] = [];
  verificationCodes: VerificationCode[] = [];

  static copy<T extends User | AuthIdentity | RefreshToken | VerificationCode>(entity: T): T {
    const Entity = entity.constructor as new (attributes: T) => T;

    return new Entity({ ...entity });
  }
}
