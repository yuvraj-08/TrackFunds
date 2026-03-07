import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
export const transactionTypeEnum = pgEnum('transaction_type', ['DEPOSIT', 'WITHDRAWAL'])
export const transactionSourceEnum = pgEnum('transaction_source', ['MANUAL', 'SMS_IMPORT'])
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex('users_email_unique').on(table.email),
  }),
)
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  ownerUserId: uuid('owner_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  institution: text('institution'),
  currencyCode: text('currency_code').default('INR').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
export const accountParticipants = pgTable(
  'account_participants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    canView: boolean('can_view').default(true).notNull(),
    canAddTransactions: boolean('can_add_transactions').default(false).notNull(),
    canEditTransactions: boolean('can_edit_transactions').default(false).notNull(),
    canDeleteTransactions: boolean('can_delete_transactions').default(false).notNull(),
    canManageParticipants: boolean('can_manage_participants').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    accountUserUnique: uniqueIndex('account_participants_account_user_unique').on(
      table.accountId,
      table.userId,
    ),
  }),
)
export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    type: transactionTypeEnum('type').notNull(),
    source: transactionSourceEnum('source').default('MANUAL').notNull(),
    ownerUserId: uuid('owner_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    spentByUserId: uuid('spent_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    recordedByUserId: uuid('recorded_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    note: text('note'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    accountOccurredAtIndex: index('transactions_account_occurred_at_idx').on(
      table.accountId,
      table.occurredAt,
    ),
    ownerUserIndex: index('transactions_owner_user_idx').on(table.ownerUserId),
    spentByUserIndex: index('transactions_spent_by_user_idx').on(table.spentByUserId),
  }),
)
export const usersRelations = relations(users, ({ many }) => ({
  ownedAccounts: many(accounts),
  accountParticipants: many(accountParticipants),
  ownedTransactions: many(transactions, { relationName: 'transaction_owner' }),
  spentTransactions: many(transactions, { relationName: 'transaction_spent_by' }),
  recordedTransactions: many(transactions, { relationName: 'transaction_recorded_by' }),
}))
export const accountsRelations = relations(accounts, ({ one, many }) => ({
  owner: one(users, {
    fields: [accounts.ownerUserId],
    references: [users.id],
  }),
  participants: many(accountParticipants),
  transactions: many(transactions),
}))
export const accountParticipantsRelations = relations(accountParticipants, ({ one }) => ({
  account: one(accounts, {
    fields: [accountParticipants.accountId],
    references: [accounts.id],
  }),
  user: one(users, {
    fields: [accountParticipants.userId],
    references: [users.id],
  }),
}))
export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  owner: one(users, {
    fields: [transactions.ownerUserId],
    references: [users.id],
    relationName: 'transaction_owner',
  }),
  spentBy: one(users, {
    fields: [transactions.spentByUserId],
    references: [users.id],
    relationName: 'transaction_spent_by',
  }),
  recordedBy: one(users, {
    fields: [transactions.recordedByUserId],
    references: [users.id],
    relationName: 'transaction_recorded_by',
  }),
}))
//# sourceMappingURL=schema.js.map
