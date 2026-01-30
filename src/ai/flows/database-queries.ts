'use server';

/**
 * @fileOverview Database query server actions for LuxeFinds.
 * 
 * Provides server-side functions to interact with SQLite database for:
 * - Fetching products
 * - Managing inventory
 * - Retrieving orders
 */

import db from '@/db/db';
import { products, inventory, orders, orderItems } from '@/db/schema';
import { eq, ilike } from 'drizzle-orm';
import type { Product } from '@/db/schema';

/**
 * Fetch all products from the database
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const result = await db.select().from(products);
    return result.map(p => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
    })) as any[];
  } catch (error) {
    console.error('Error fetching all products:', error);
    throw new Error('Failed to fetch products');
  }
}

/**
 * Fetch a product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const result = await db.select().from(products).where(eq(products.id, id));
    if (result.length === 0) return null;
    
    const product = result[0];
    return {
      ...product,
      images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
    } as any;
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    throw new Error('Failed to fetch product');
  }
}

/**
 * Fetch products by category
 */
export async function getProductsByCategory(
  category: 'Jewelry' | 'Watches' | 'Bags' | 'Accessories'
): Promise<Product[]> {
  try {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.category, category));
    
    return result.map(p => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
    })) as any[];
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw new Error('Failed to fetch products by category');
  }
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.featured, true));
    
    return result.map(p => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
    })) as any[];
  } catch (error) {
    console.error('Error fetching featured products:', error);
    throw new Error('Failed to fetch featured products');
  }
}

/**
 * Search products by name or description
 */
export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const searchTerm = `%${query}%`;
    const result = await db
      .select()
      .from(products)
      .where(ilike(products.name, searchTerm));
    
    return result.map(p => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
    })) as any[];
  } catch (error) {
    console.error('Error searching products:', error);
    throw new Error('Failed to search products');
  }
}

/**
 * Get inventory level for a product
 */
export async function getInventoryLevel(productId: string): Promise<number> {
  try {
    const result = await db
      .select()
      .from(inventory)
      .where(eq(inventory.productId, productId));
    
    return result.length > 0 ? result[0].quantity : 0;
  } catch (error) {
    console.error('Error fetching inventory level:', error);
    throw new Error('Failed to fetch inventory level');
  }
}

/**
 * Update inventory after purchase
 */
export async function updateInventoryAfterPurchase(
  productId: string,
  quantity: number
): Promise<boolean> {
  try {
    const currentInventory = await db
      .select()
      .from(inventory)
      .where(eq(inventory.productId, productId));
    
    if (currentInventory.length === 0) {
      throw new Error('Product not found in inventory');
    }

    const newQuantity = currentInventory[0].quantity - quantity;
    if (newQuantity < 0) {
      throw new Error('Insufficient inventory');
    }

    await db
      .update(inventory)
      .set({ quantity: newQuantity, updatedAt: new Date() })
      .where(eq(inventory.productId, productId));

    return true;
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw new Error('Failed to update inventory');
  }
}

/**
 * Get all products with inventory levels
 */
export async function getProductsWithInventory(): Promise<
  (Product & { inventoryLevel: number })[]
> {
  try {
    const allProducts = await getAllProducts();
    const productsWithInventory = await Promise.all(
      allProducts.map(async (product) => ({
        ...product,
        inventoryLevel: await getInventoryLevel(product.id),
      }))
    );
    return productsWithInventory;
  } catch (error) {
    console.error('Error fetching products with inventory:', error);
    throw new Error('Failed to fetch products with inventory');
  }
}
