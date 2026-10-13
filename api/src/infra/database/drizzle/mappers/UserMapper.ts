import { User } from '#application/entities/User';
import type { users } from '#infra/database/drizzle/schema/index';

export class UserMapper {
  static toEntity(row: typeof users.$inferSelect): User {
    return new User(row);
  }

  static toPersistence(user: User): typeof users.$inferInsert {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
