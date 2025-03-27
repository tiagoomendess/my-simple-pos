import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { products } from '$lib/db/schema';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
    const categoryId = url.searchParams.get('categoryId');
    let query = db.select().from(products);
    
    if (categoryId) {
        query = query.where(eq(products.categoryId, parseInt(categoryId)));
    }
    
    const allProducts = await query;
    return json(allProducts);
};

export const POST: RequestHandler = async ({ request }) => {
    const { name, price, image, categoryId } = await request.json();
    const result = await db.insert(products).values({
        name,
        price,
        image,
        categoryId
    }).returning();
    return json(result[0]);
};
