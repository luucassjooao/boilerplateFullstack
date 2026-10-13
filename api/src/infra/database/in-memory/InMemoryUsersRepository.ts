import type { IUsersRepository } from '#application/contracts/repositories/IUsersRepository';
import type { AuthIdentity } from '#application/entities/AuthIdentity';
import type { User } from '#application/entities/User';
import { EmailAlreadyInUse } from '#application/errors/application/EmailAlreadyInUse';
import { InMemoryDatabase } from '#infra/database/in-memory/InMemoryDatabase';

export class InMemoryUsersRepository implements IUsersRepository {
  constructor(private readonly database: InMemoryDatabase) {}

  async create(user: User): Promise<void> {
    this.assertEmailAvailable(user);
    this.database.users.push(InMemoryDatabase.copy(user));
  }

  async createWithIdentity(user: User, identity: AuthIdentity): Promise<void> {
    this.assertEmailAvailable(user);
    this.assertIdentityAvailable(identity);
    this.database.users.push(InMemoryDatabase.copy(user));
    this.database.authIdentities.push(InMemoryDatabase.copy(identity));
  }

  async linkIdentity(user: User, identity: AuthIdentity): Promise<void> {
    this.assertIdentityAvailable(identity);
    await this.update(user);
    this.database.authIdentities.push(InMemoryDatabase.copy(identity));
  }

  async findById(id: string): Promise<User | null> {
    const user = this.database.users.find((item) => item.id === id);

    return user ? InMemoryDatabase.copy(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.database.users.find((item) => item.email === email);

    return user ? InMemoryDatabase.copy(user) : null;
  }

  async update(user: User): Promise<void> {
    const index = this.database.users.findIndex((item) => item.id === user.id);

    if (index >= 0) {
      this.database.users[index] = InMemoryDatabase.copy(user);
    }
  }

  async delete(id: string): Promise<void> {
    const { database } = this;

    database.users = database.users.filter((item) => item.id !== id);
    database.authIdentities = database.authIdentities.filter((item) => item.userId !== id);
    database.refreshTokens = database.refreshTokens.filter((item) => item.userId !== id);
    database.verificationCodes = database.verificationCodes.filter((item) => item.userId !== id);
  }

  private assertEmailAvailable(user: User): void {
    if (this.database.users.some((item) => item.email === user.email)) {
      throw new EmailAlreadyInUse();
    }
  }

  private assertIdentityAvailable(identity: AuthIdentity): void {
    const taken = this.database.authIdentities.some(
      (item) => item.provider === identity.provider && item.providerUserId === identity.providerUserId,
    );

    if (taken) {
      throw new Error(`Identity ${identity.provider}:${identity.providerUserId} already exists`);
    }
  }
}
