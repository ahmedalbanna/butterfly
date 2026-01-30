import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';

/**
 * Products table - stores all luxury boutique items
 */
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category', { enum: ['Jewelry', 'Watches', 'Bags', 'Accessories'] }).notNull(),
  price: real('price').notNull(),
  description: text('description').notNull(),
  materials: text('materials').notNull(),
  care: text('care').notNull(),
  image: text('image').notNull(),
  images: text('images').notNull(), // JSON stringified array
  featured: integer('featured', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Inventory table - tracks stock levels for products
 */
export const inventory = sqliteTable('inventory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(100),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Orders table - stores customer orders
 */
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  total: real('total').notNull(),
  status: text('status', { enum: ['pending', 'completed', 'cancelled'] }).default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * OrderItems table - line items within orders
 */
export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull(), // Price at time of purchase
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Inventory = typeof inventory.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
