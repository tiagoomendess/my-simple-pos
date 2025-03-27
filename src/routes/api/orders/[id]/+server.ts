import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { orders, orderLines, products } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
    const orderId = parseInt(params.id);
    
    const order = await db.select().from(orders).where(eq(orders.id, orderId)).get();
    
    if (!order) {
        return new Response('Order not found', { status: 404 });
    }
    
    const lines = await db.select()
        .from(orderLines)
        .leftJoin(products, eq(orderLines.productId, products.id))
        .where(eq(orderLines.orderId, orderId));
    
    return json({
        ...order,
        lines
    });
};
