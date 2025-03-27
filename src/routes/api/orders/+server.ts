import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { orders, orderLines, products } from '$lib/db/schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    const allOrders = await db.select().from(orders);
    return json(allOrders);
};

export const POST: RequestHandler = async ({ request }) => {
    const { orderItems } = await request.json();
    
    // Calculate total price and create order
    const totalPrice = orderItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    
    const now = new Date();
    const result = await db.transaction(async (tx) => {
        // Create order
        const [order] = await tx.insert(orders).values({
            createdAt: now,
            updatedAt: now,
            totalPrice
        }).returning();
        
        // Create order lines
        await tx.insert(orderLines).values(
            orderItems.map((item: any) => ({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                priceAtTime: item.price
            }))
        );
        
        return order;
    });
    
    return json(result);
}; 
