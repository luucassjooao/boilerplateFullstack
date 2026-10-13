import type { AuthIdentity } from '#application/entities/AuthIdentity';
import type { User } from '#application/entities/User';

export interface IUsersRepository {
  /** @throws EmailAlreadyInUse when the email is taken (guaranteed by the implementation, not by a prior lookup). */
  create(user: User): Promise<void>;
  /** Atomically creates the user and its first social identity. @throws EmailAlreadyInUse */
  createWithIdentity(user: User, identity: AuthIdentity): Promise<void>;
  /** Atomically saves the user and attaches a new social identity to it. */
  linkIdentity(user: User, identity: AuthIdentity): Promise<void>;
  findById(id: string): Promise<User | null>;
  /** Expects an already normalized email (User.normalizeEmail). */
  findByEmail(email: string): Promise<User | null>;
  update(user: User): Promise<void>;
  /** Deletes the user and everything that belongs to it (identities, tokens, codes). */
  delete(id: string): Promise<void>;
}
