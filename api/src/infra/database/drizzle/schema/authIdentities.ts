import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const authIdentities = pgTable('auth_identities', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider', { enum: ['google', 'apple'] }).notNull(),
  providerUserId: text('provider_user_id').notNull(),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
}, (table) => [
  uniqueIndex('auth_identities_provider_user_unique').on(table.provider, table.providerUserId),
  index('auth_identities_user_id_idx').on(table.userId),
]);
