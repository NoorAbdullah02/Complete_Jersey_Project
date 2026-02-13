import { pgTable, serial, varchar, text, decimal, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const orders = pgTable('orders', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 30 }).notNull(),
    mobileNumber: varchar('mobile_number', { length: 15 }).notNull(),
    email: varchar('email', { length: 40 }).notNull(),
    transactionId: varchar('transaction_id', { length: 30 }),
    notes: text('notes'),
    finalPrice: decimal('final_price', { precision: 10, scale: 2 }).notNull(),
    status: varchar('status', { length: 20 }).default('pending'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const orderItems = pgTable('order_items', {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
    jerseyNumber: varchar('jersey_number', { length: 6 }).notNull(),
    jerseyName: varchar('jersey_name', { length: 30 }),
    batch: varchar('batch', { length: 15 }),
    size: varchar('size', { length: 10 }).notNull(),
    collarType: varchar('collar_type', { length: 20 }).notNull(),
    sleeveType: varchar('sleeve_type', { length: 20 }).notNull(),
    itemPrice: decimal('item_price', { precision: 10, scale: 2 }).notNull(),
});

export const ordersRelations = relations(orders, ({ many }) => ({
    items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
}));

export const adminUsers = pgTable('admin_users', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 30 }).unique().notNull(),
    name: varchar('name', { length: 60 }),
    email: varchar('email', { length: 100 }),
    passwordHash: varchar('password_hash', { length: 200 }).notNull(),
    isVerified: boolean('is_verified').default(false),
    verificationToken: varchar('verification_token', { length: 200 }),
    refreshToken: varchar('refresh_token', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow(),
});

export const expenses = pgTable('expenses', {
    id: serial('id').primaryKey(),
    description: varchar('description', { length: 200 }).notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    category: varchar('category', { length: 50 }).default('general'),
    date: varchar('date', { length: 20 }),
    createdBy: varchar('created_by', { length: 30 }),
    createdAt: timestamp('created_at').defaultNow(),
});
