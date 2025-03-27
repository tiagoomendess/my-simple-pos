import { initializeDatabase } from '$lib/db';

export async function load() {
    await initializeDatabase();
    return {};
} 