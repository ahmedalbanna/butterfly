'use server';

import { prisma } from '@/lib/db';
import { Product } from '@prisma/client';
import { 
  getCachedProduct, 
  cacheProduct,
  cacheMultiple,
  getMultiple,
  CACHE_KEYS,
  CACHE_TTL 
} from '@/lib/redis-cache';

/**
 * Get all products from database with Redis caching
 */
export async function getProducts(): Promise<Product[]> {
  try {
    // Try cache first
    const cacheKey = CACHE_KEYS.productList();
    const cached = await getCachedProduct(cacheKey);
    
    if (cached) {
      console.log('[Products] Cache hit for product list');
      return cached;
    }

    // Cache miss - fetch from database
    const products = await prisma.product.findMany({
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Cache the result
    if (products.length > 0) {
      await cacheProduct({ id: cacheKey, data: products });
    }

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Get products by category (accepts category ID or name)
 */
export async function getProductsByCategory(categoryIdOrName: string): Promise<Product[]> {
  try {
    if (categoryIdOrName === 'All') {
      return getProducts();
    }
    
    // Try to find by ID first, then by name
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { categoryId: categoryIdOrName },
          { category: { name: categoryIdOrName } }
        ]
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    return products;
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
}

/**
 * Get products by category slug
 */
export async function getProductsByCategorySlug(slug: string): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        category: {
          slug: slug
        }
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    return products;
  } catch (error) {
    console.error('Error fetching products by category slug:', error);
    return [];
  }
}

/**
 * Get a single product by ID with Redis caching
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    // Try cache first
    const cached = await getCachedProduct(id);
    
    if (cached) {
      console.log(`[Products] Cache hit for product ${id}`);
      return cached;
    }

    // Cache miss - fetch from database
    const product = await prisma.product.findUnique({
      where: { id }
    });

    // Cache the result
    if (product) {
      await cacheProduct(product);
    }

    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

/**
 * Get featured products with Redis caching
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    // Try cache first
    const cacheKey = CACHE_KEYS.productList('featured');
    const cached = await getCachedProduct(cacheKey);
    
    if (cached) {
      console.log('[Products] Cache hit for featured products');
      return cached;
    }

    // Cache miss - fetch from database
    const products = await prisma.product.findMany({
      where: { featured: true },
      orderBy: { createdAt: 'desc' }
    });

    // Cache the result
    if (products.length > 0) {
      await cacheProduct({ id: cacheKey, data: products });
    }

    return products;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

/**
 * Search products by name, description, materials, or category name
 */
export async function searchProducts(query: string): Promise<Product[]> {
  try {
    if (!query.trim()) return [];

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { materials: { contains: query, mode: 'insensitive' } },
          { category: { name: { contains: query, mode: 'insensitive' } } }
        ]
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    return products;
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}
