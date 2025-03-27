import { db } from '$lib/db';
import { categories, products, orders } from '$lib/db/schema';
import { eq, sql, isNull } from 'drizzle-orm';
import type { Actions } from './$types';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { json } from '@sveltejs/kit';

export async function load() {
    // Get categories
    const allCategories = await db.select().from(categories);

    // Get active products (not soft-deleted)
    const allProducts = await db
        .select()
        .from(products)
        .where(isNull(products.deletedAt));

    // Group products by category
    const productsByCategory = allCategories.reduce((acc, category) => {
        acc[category.id] = allProducts.filter(product => product.categoryId === category.id);
        return acc;
    }, {} as Record<number, typeof allProducts>);

    // Get order statistics
    const [stats] = await db
        .select({
            totalOrders: sql<number>`count(*)`,
            totalSales: sql<number>`sum(total_price)`,
            averageOrderValue: sql<number>`avg(total_price)`
        })
        .from(orders);

    return {
        categories: allCategories,
        productsByCategory,
        stats: {
            totalOrders: stats.totalOrders || 0,
            totalSales: stats.totalSales || 0,
            averageOrderValue: stats.averageOrderValue || 0
        }
    };
}

async function saveProductImage(image: File): Promise<string> {
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate a unique filename
    const timestamp = Date.now();
    const extension = image.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `product-${timestamp}.${extension}`;
    
    // Save to the static directory
    const imagePath = join(process.cwd(), 'static', 'product-images', filename);
    await writeFile(imagePath, buffer);
    
    return `/product-images/${filename}`;
}

export const actions = {
    addCategory: async ({ request }) => {
        const formData = await request.formData();
        const name = formData.get('name') as string;

        if (!name) {
            return { success: false, error: 'Name is required' };
        }

        try {
            const [category] = await db.insert(categories).values({ name }).returning();
            return { success: true, data: category };
        } catch (error) {
            console.error('Error adding category:', error);
            return { success: false, error: 'Failed to add category' };
        }
    },

    removeCategory: async ({ request }) => {
        const formData = await request.formData();
        const id = parseInt(formData.get('id') as string);

        if (!id) {
            return { success: false, error: 'Category ID is required' };
        }

        try {
            await db.delete(categories).where(eq(categories.id, id));
            return { success: true, data: { id } };
        } catch (error) {
            console.error('Error deleting category:', error);
            return { success: false, error: 'Failed to delete category' };
        }
    },

    addProduct: async ({ request }) => {
        const formData = await request.formData();
        const name = formData.get('name') as string;
        const price = parseFloat(formData.get('price') as string);
        const categoryId = parseInt(formData.get('categoryId') as string);
        const imageFile = formData.get('image') as File;

        if (!name || !price || !categoryId || !imageFile) {
            return { success: false, error: 'All fields are required' };
        }

        try {
            // Convert the file to a buffer
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            
            // Create a unique filename
            const timestamp = Date.now();
            const filename = `${timestamp}-${imageFile.name}`;
            const filepath = join('static', 'product-images', filename);

            // Save the file
            await writeFile(filepath, buffer);

            // Insert the product with the file path
            const [product] = await db.insert(products).values({
                name,
                price,
                categoryId,
                image: `/product-images/${filename}`
            }).returning();

            return { success: true, data: { product } };
        } catch (error) {
            console.error('Error adding product:', error);
            return { success: false, error: 'Failed to add product' };
        }
    },

    removeProduct: async ({ request }) => {
        const formData = await request.formData();
        const id = parseInt(formData.get('id') as string);

        if (!id) {
            return { success: false, error: 'Product ID is required' };
        }

        try {
            // Get the product first to get its category ID
            const [product] = await db
                .select()
                .from(products)
                .where(eq(products.id, id));

            if (!product) {
                return { success: false, error: 'Product not found' };
            }

            // Soft delete the product
            await db
                .update(products)
                .set({ deletedAt: new Date() })
                .where(eq(products.id, id));

            return { 
                success: true,
                data: {
                    productId: id,
                    categoryId: product.categoryId
                }
            };
        } catch (error) {
            console.error('Error deleting product:', error);
            return { success: false, error: 'Failed to delete product' };
        }
    }
} satisfies Actions;
