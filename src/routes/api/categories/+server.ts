import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { categories } from '$lib/db/schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    const allCategories = await db.select().from(categories);
    return json(allCategories);
};

export const POST: RequestHandler = async ({ request }) => {
    const { name } = await request.json();
    const result = await db.insert(categories).values({ name }).returning();
    return json(result[0]);
}; 