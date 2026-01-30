'use server';

import { prisma } from '@/lib/db';
import { Product } from '@prisma/client';

/**
 * Get all products from database
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Get products by category
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  try {
    if (category === 'All') {
      return getProducts();
    }
    
    const products = await prisma.product.findMany({
      where: { category },
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
 * Get a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { id }
    });
    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      where: { featured: true },
      orderBy: { createdAt: 'desc' }
    });
    return products;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

/**
 * Search products by name or description
 */
export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } }
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
