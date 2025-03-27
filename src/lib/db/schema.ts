import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  price: real('price').notNull(),
  image: text('image').notNull(), // Will store the image path or URL
  categoryId: integer('category_id').references(() => categories.id),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  totalPrice: real('total_price').notNull(),
  amountPaid: real('amount_paid').notNull(),
  change: real('change').notNull()
});

export const orderLines = sqliteTable('order_lines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  priceAtTime: real('price_at_time').notNull(), // Price when order was made
}); 