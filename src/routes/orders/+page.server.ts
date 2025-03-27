import { db } from '$lib/db';
import { orders, orderLines, products } from '$lib/db/schema';
import type { PageServerLoad, Actions } from './$types';
import { json } from '@sveltejs/kit';
import { desc, eq, sql } from 'drizzle-orm';

const ITEMS_PER_PAGE = 10;

export async function load({ url }) {
    const page = parseInt(url.searchParams.get('page') || '1');
    const offset = (page - 1) * ITEMS_PER_PAGE;

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
        orders: ordersWithItems,
        totalPages: Math.ceil(count / ITEMS_PER_PAGE),
        currentPage: page
    };
}

export const actions = {
    deleteOrder: async ({ request }) => {
        const formData = await request.formData();
        const orderId = parseInt(formData.get('orderId') as string);

        try {
            // Delete order lines first (due to foreign key constraint)
            await db.delete(orderLines).where(eq(orderLines.orderId, orderId));
            
            // Then delete the order
            await db.delete(orders).where(eq(orders.id, orderId));

            return json({ type: 'success' });
        } catch (error) {
            console.error('Error deleting order:', error);
            return json({ 
                type: 'error',
                error: 'Failed to delete order'
            }, { status: 500 });
        }
    }
} satisfies Actions; 