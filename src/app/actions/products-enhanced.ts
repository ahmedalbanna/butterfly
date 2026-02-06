'use server';

import { prisma } from '@/lib/db';
import { Product } from '@prisma/client';
import { 
  smartCacheGet, 
  GRANULAR_CACHE_KEYS,
  getTimeBasedTTL,
  invalidateRelated,
} from '@/lib/redis-cache-advanced';
import { CACHE_TTL } from '@/lib/redis-cache';

/**
 * Enhanced product actions with granular caching
 */

export async function getProductsByPrice(minPrice: number, maxPrice: number): Promise<Product[]> {
  const key = GRANULAR_CACHE_KEYS.productByPrice(minPrice, maxPrice);
  const ttl = getTimeBasedTTL(CACHE_TTL.PRODUCT, 'product');
  
  return await smartCacheGet(
    key,
    async () => {
      return await prisma.product.findMany({
        where: {
          price: {
            gte: minPrice,
            lte: maxPrice,
          },
        },
        orderBy: { featured: 'desc' },
      });
    },
    ttl
  );
}

export async function searchProducts(query: string, page: number = 1, limit: number = 20): Promise<{
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const key = GRANULAR_CACHE_KEYS.productSearch(query, page);
  const ttl = getTimeBasedTTL(CACHE_TTL.PRODUCT, 'product');
  
  return await smartCacheGet(
    key,
    async () => {
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { category: { name: { contains: query, mode: 'insensitive' } } },
            ],
          },
          skip: (page - 1) * limit,
          take: limit,
          include: { category: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { category: { name: { contains: query, mode: 'insensitive' } } },
            ],
          },
        }),
      ]);

      return {
        products,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    },
    ttl
  );
}

export async function getTrendingProducts(days: number = 7): Promise<Product[]> {
  const key = GRANULAR_CACHE_KEYS.productTrending(days);
  const ttl = CACHE_TTL.STATISTICS; // 1 minute
  
  return await smartCacheGet(
    key,
    async () => {
      // Get products from recent orders
      const recentOrderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: {
              gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
            },
          },
        },
        include: { product: true },
      });

      // Count frequency and get unique products
      const productCounts = new Map<string, { count: number; product: Product }>();
      
      recentOrderItems.forEach(item => {
        const existing = productCounts.get(item.productId);
        if (existing) {
          existing.count += item.quantity;
        } else {
          productCounts.set(item.productId, { count: item.quantity, product: item.product });
        }
      });

      // Sort by popularity and return top products
      return Array.from(productCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(({ product }) => product);
    },
    ttl
  );
}

export async function getFeaturedProductsPaginated(limit: number = 10): Promise<Product[]> {
  const key = GRANULAR_CACHE_KEYS.productByFeatured(true, limit);
  const ttl = getTimeBasedTTL(CACHE_TTL.PRODUCT, 'product');
  
  return await smartCacheGet(
    key,
    async () => {
      return await prisma.product.findMany({
        where: { featured: true },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    },
    ttl
  );
}

/**
 * Invalidate product caches when product changes
 */
export async function invalidateProductCaches(productId?: string): Promise<void> {
  await invalidateRelated('product', productId);
}
