import { db } from '$lib/db';
import { categories, products, orders, orderLines } from '$lib/db/schema';
import type { PageServerLoad, Actions } from './$types';
import { json } from '@sveltejs/kit';
import { eq, sql, desc, isNull } from 'drizzle-orm';

const ITEMS_PER_PAGE = 20;

interface OrderItem {
    id: number;
    quantity: number;
    price: number;
}

export async function load({ url }) {
    const page = parseInt(url.searchParams.get('page') || '1');
    const offset = (page - 1) * ITEMS_PER_PAGE;

    // Get categories
    const allCategories = await db.select().from(categories);

    // Get products
    const allProducts = await db
        .select()
        .from(products)
        .where(isNull(products.deletedAt));

    // Group products by category
    const productsByCategory = allCategories.reduce((acc, category) => {
        acc[category.id] = allProducts.filter(product => product.categoryId === category.id);
        return acc;
    }, {} as Record<number, typeof allProducts>);

    // Get total count for pagination
    const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders);

    // Get orders with pagination
    const allOrders = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(ITEMS_PER_PAGE)
        .offset(offset);

    // Get order items for each order
    const ordersWithItems = await Promise.all(
        allOrders.map(async (order) => {
            const items = await db
                .select({
                    id: orderLines.id,
                    productId: orderLines.productId,
                    quantity: orderLines.quantity,
                    priceAtTime: orderLines.priceAtTime,
                    name: products.name
                })
                .from(orderLines)
                .leftJoin(products, eq(orderLines.productId, products.id))
                .where(eq(orderLines.orderId, order.id));

            return {
                ...order,
                items
            };
        })
    );

    return {
        categories: allCategories,
        productsByCategory,
        orders: ordersWithItems,
        totalPages: Math.ceil(count / ITEMS_PER_PAGE),
        currentPage: page
    };
}

export const actions = {
    createOrder: async ({ request }) => {
        try {
            const formData = await request.formData();
            
            // Parse the form data
            const items = JSON.parse(formData.get('items') as string);
            const total = parseFloat(formData.get('total') as string);
            const amountPaid = parseFloat(formData.get('amountPaid') as string);
            const change = parseFloat(formData.get('change') as string);

            // Start a transaction
            const [order] = await db.insert(orders)
                .values({
                    totalPrice: total,
                    createdAt: new Date(),
                    updatedAt: new Date()
                })
                .returning();

            // Insert all order items
            await db.insert(orderLines)
                .values(
                    items.map((item: OrderItem) => ({
                        orderId: order.id,
                        productId: item.id,
                        quantity: item.quantity,
                        priceAtTime: item.price
                    }))
                );

            return {
                type: 'success',
                data: { order }
            };
        } catch (error) {
            console.error('Error creating order:', error);
            return {
                type: 'error',
                error: 'Failed to create order'
            };
        }
    }
} satisfies Actions; 
