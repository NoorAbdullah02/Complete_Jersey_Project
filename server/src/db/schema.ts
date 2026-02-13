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

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 100 }).unique().notNull(),
    name: varchar('name', { length: 60 }),
    passwordHash: varchar('password_hash', { length: 200 }),
    isVerified: boolean('is_verified').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});

export const adminUsers = pgTable('admin_users', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 30 }).unique().notNull(),
    name: varchar('name', { length: 60 }),
    email: varchar('email', { length: 100 }),
    passwordHash: varchar('password_hash', { length: 200 }).notNull(),
    role: varchar('role', { length: 20 }).default('admin'), // 'admin', 'manager', 'support'
    isVerified: boolean('is_verified').default(false),
    verificationToken: varchar('verification_token', { length: 200 }),
    refreshToken: varchar('refresh_token', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow(),
});

export const authenticators = pgTable('authenticators', {
    credentialID: varchar('credential_id', { length: 300 }).primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    adminUserId: integer('admin_user_id').references(() => adminUsers.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }),
    credentialPublicKey: text('credential_public_key').notNull(),
    counter: integer('counter').default(0).notNull(),
    credentialDeviceType: varchar('credential_device_type', { length: 30 }).notNull(),
    credentialBackedUp: boolean('credential_backed_up').default(false).notNull(),
    transports: varchar('transports', { length: 200 }),
    createdAt: timestamp('created_at').defaultNow(),
});

export const webauthnChallenges = pgTable('webauthn_challenges', {
    id: serial('id').primaryKey(),
    challenge: varchar('challenge', { length: 300 }).notNull(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    adminUserId: integer('admin_user_id').references(() => adminUsers.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at').notNull(),
});

export const sessions = pgTable('sessions', {
    id: varchar('id', { length: 200 }).primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    adminUserId: integer('admin_user_id').references(() => adminUsers.id, { onDelete: 'cascade' }),
    deviceInfo: text('device_info'),
    ipAddress: varchar('ip_address', { length: 50 }),
    lastUsed: timestamp('last_used').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    adminUserId: integer('admin_user_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 100 }).notNull(),
    metadata: text('metadata'), // JSON string
    createdAt: timestamp('created_at').defaultNow(),
});

export const inventory = pgTable('inventory', {
    id: serial('id').primaryKey(),
    itemName: varchar('item_name', { length: 100 }).unique().notNull(),
    sku: varchar('sku', { length: 50 }).unique().notNull(),
    quantity: integer('quantity').default(0).notNull(),
    minThreshold: integer('min_threshold').default(10),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const stockLogs = pgTable('stock_logs', {
    id: serial('id').primaryKey(),
    inventoryId: integer('inventory_id').references(() => inventory.id, { onDelete: 'cascade' }),
    change: integer('change').notNull(),
    reason: varchar('reason', { length: 100 }),
    adminUserId: integer('admin_user_id').references(() => adminUsers.id),
    createdAt: timestamp('created_at').defaultNow(),
});

export const coupons = pgTable('coupons', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 20 }).unique().notNull(),
    discountType: varchar('discount_type', { length: 20 }).notNull(),
    discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
    maxUsage: integer('max_usage'),
    currentUsage: integer('current_usage').default(0),
    expiryDate: timestamp('expiry_date'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
});

export const paymentLogs = pgTable('payment_logs', {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 20 }).notNull(),
    transactionId: varchar('transaction_id', { length: 100 }).notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(),
    rawResponse: text('raw_response'),
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

// Relations
export const ordersRelations = relations(orders, ({ many }) => ({
    items: many(orderItems),
    paymentLogs: many(paymentLogs),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
    authenticators: many(authenticators),
    sessions: many(sessions),
    auditLogs: many(auditLogs),
}));

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
    authenticators: many(authenticators),
    sessions: many(sessions),
    auditLogs: many(auditLogs),
}));

export const authenticatorsRelations = relations(authenticators, ({ one }) => ({
    user: one(users, { fields: [authenticators.userId], references: [users.id] }),
    adminUser: one(adminUsers, { fields: [authenticators.adminUserId], references: [adminUsers.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
    adminUser: one(adminUsers, { fields: [sessions.adminUserId], references: [adminUsers.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
    adminUser: one(adminUsers, { fields: [auditLogs.adminUserId], references: [adminUsers.id] }),
}));

export const paymentLogsRelations = relations(paymentLogs, ({ one }) => ({
    order: one(orders, { fields: [paymentLogs.orderId], references: [orders.id] }),
}));

export const inventoryRelations = relations(inventory, ({ many }) => ({
    logs: many(stockLogs),
}));

export const stockLogsRelations = relations(stockLogs, ({ one }) => ({
    item: one(inventory, { fields: [stockLogs.inventoryId], references: [inventory.id] }),
    admin: one(adminUsers, { fields: [stockLogs.adminUserId], references: [adminUsers.id] }),
}));
