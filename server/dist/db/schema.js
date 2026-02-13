"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenses = exports.adminUsers = exports.orderItemsRelations = exports.ordersRelations = exports.orderItems = exports.orders = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.orders = (0, pg_core_1.pgTable)('orders', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 30 }).notNull(),
    mobileNumber: (0, pg_core_1.varchar)('mobile_number', { length: 15 }).notNull(),
    email: (0, pg_core_1.varchar)('email', { length: 40 }).notNull(),
    transactionId: (0, pg_core_1.varchar)('transaction_id', { length: 30 }),
    notes: (0, pg_core_1.text)('notes'),
    finalPrice: (0, pg_core_1.decimal)('final_price', { precision: 10, scale: 2 }).notNull(),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('pending'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
});
exports.orderItems = (0, pg_core_1.pgTable)('order_items', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    orderId: (0, pg_core_1.integer)('order_id').references(() => exports.orders.id, { onDelete: 'cascade' }).notNull(),
    jerseyNumber: (0, pg_core_1.varchar)('jersey_number', { length: 6 }).notNull(),
    jerseyName: (0, pg_core_1.varchar)('jersey_name', { length: 30 }),
    batch: (0, pg_core_1.varchar)('batch', { length: 15 }),
    size: (0, pg_core_1.varchar)('size', { length: 10 }).notNull(),
    collarType: (0, pg_core_1.varchar)('collar_type', { length: 20 }).notNull(),
    sleeveType: (0, pg_core_1.varchar)('sleeve_type', { length: 20 }).notNull(),
    itemPrice: (0, pg_core_1.decimal)('item_price', { precision: 10, scale: 2 }).notNull(),
});
exports.ordersRelations = (0, drizzle_orm_1.relations)(exports.orders, ({ many }) => ({
    items: many(exports.orderItems),
}));
exports.orderItemsRelations = (0, drizzle_orm_1.relations)(exports.orderItems, ({ one }) => ({
    order: one(exports.orders, {
        fields: [exports.orderItems.orderId],
        references: [exports.orders.id],
    }),
}));
exports.adminUsers = (0, pg_core_1.pgTable)('admin_users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    username: (0, pg_core_1.varchar)('username', { length: 30 }).unique().notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 60 }),
    email: (0, pg_core_1.varchar)('email', { length: 100 }),
    passwordHash: (0, pg_core_1.varchar)('password_hash', { length: 200 }).notNull(),
    isVerified: (0, pg_core_1.boolean)('is_verified').default(false),
    verificationToken: (0, pg_core_1.varchar)('verification_token', { length: 200 }),
    refreshToken: (0, pg_core_1.varchar)('refresh_token', { length: 500 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
exports.expenses = (0, pg_core_1.pgTable)('expenses', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    description: (0, pg_core_1.varchar)('description', { length: 200 }).notNull(),
    amount: (0, pg_core_1.decimal)('amount', { precision: 10, scale: 2 }).notNull(),
    category: (0, pg_core_1.varchar)('category', { length: 50 }).default('general'),
    date: (0, pg_core_1.varchar)('date', { length: 20 }),
    createdBy: (0, pg_core_1.varchar)('created_by', { length: 30 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
});
//# sourceMappingURL=schema.js.map