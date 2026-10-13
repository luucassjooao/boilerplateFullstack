import { eq } from 'drizzle-orm';
import type { IUsersRepository } from '#application/contracts/repositories/IUsersRepository';
import type { AuthIdentity } from '#application/entities/AuthIdentity';
import type { User } from '#application/entities/User';
import { EmailAlreadyInUse } from '#application/errors/application/EmailAlreadyInUse';
import type { DrizzleDatabase } from '#infra/database/drizzle/client';
import { isUniqueViolation } from '#infra/database/drizzle/isUniqueViolation';
import { AuthIdentityMapper } from '#infra/database/drizzle/mappers/AuthIdentityMapper';
import { UserMapper } from '#infra/database/drizzle/mappers/UserMapper';
import { authIdentities, users } from '#infra/database/drizzle/schema/index';

export class DrizzleUsersRepository implements IUsersRepository {
  constructor(private readonly db: DrizzleDatabase) {}

  async create(user: User): Promise<void> {
    await this.translateErrors(() => this.db.insert(users).values(UserMapper.toPersistence(user)));
  }

  async createWithIdentity(user: User, identity: AuthIdentity): Promise<void> {
    await this.translateErrors(() => this.db.transaction(async (tx) => {
      await tx.insert(users).values(UserMapper.toPersistence(user));
      await tx.insert(authIdentities).values(AuthIdentityMapper.toPersistence(identity));
    }));
  }

  async linkIdentity(user: User, identity: AuthIdentity): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.update(users).set(UserMapper.toPersistence(user)).where(eq(users.id, user.id));
      await tx.insert(authIdentities).values(AuthIdentityMapper.toPersistence(identity));
    });
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);

    return row ? UserMapper.toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);

    return row ? UserMapper.toEntity(row) : null;
  }

  async update(user: User): Promise<void> {
    await this.db.update(users).set(UserMapper.toPersistence(user)).where(eq(users.id, user.id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  private async translateErrors(operation: () => Promise<unknown>): Promise<void> {
    try {
      await operation();
    } catch (error) {
      if (isUniqueViolation(error, 'users_email_unique')) {
        throw new EmailAlreadyInUse();
      }

      throw error;
    }
  }
}
