'use server';

import { prisma } from '@/lib/db';
import { Product } from '@prisma/client';
import { 
  getCachedProduct, 
  cacheProduct,
  cacheGet,
  cacheSet,
  cacheMultiple,
  getMultiple,
  CACHE_KEYS,
  CACHE_TTL 
} from '@/lib/redis-cache';
import { 
  smartCacheGet, 
  GRANULAR_CACHE_KEYS,
  getTimeBasedTTL,
  invalidateRelated,
} from '@/lib/redis-cache-advanced';

/**
 * Type definitions
 */
export type GroupedProducts = {
  name: string;
  products: Product[];
};

/**
 * ============================================================================
 * CORE PRODUCT OPERATIONS
 * ============================================================================
 */

/**
 * Get all products from database with Redis caching
 */
export async function getProducts(): Promise<Product[]> {
  try {
    // Try cache first
    const cacheKey = CACHE_KEYS.productList();
    const cached = await cacheGet<Product[]>(cacheKey);
    
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
      await cacheSet(cacheKey, products, CACHE_TTL.PRODUCT);
    }

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
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
 * Get featured products with Redis caching
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    // Try cache first
    const cacheKey = CACHE_KEYS.productList('featured');
    const cached = await cacheGet<Product[]>(cacheKey);
    
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
      await cacheSet(cacheKey, products, CACHE_TTL.PRODUCT);
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

/**
 * ============================================================================
 * ENHANCED PRODUCT OPERATIONS (with granular caching)
 * ============================================================================
 */

/**
 * Get products filtered by price range
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

/**
 * Search products with pagination
 */
export async function searchProductsPaginated(
  query: string, 
  page: number = 1, 
  limit: number = 20
): Promise<{
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

/**
 * Get trending products based on recent order data
 */
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

/**
 * Get featured products with pagination and granular caching
 */
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
 * ============================================================================
 * PAGE DATA AGGREGATION OPERATIONS
 * ============================================================================
 */

/**
 * Get all products grouped by category for the home page
 */
export async function getHomePageData(): Promise<GroupedProducts[]> {
  try {
    const { getCategories } = await import('./categories');
    const [allProducts, categories] = await Promise.all([
      getProducts(),
      getCategories()
    ]);
    
    // Group products by category using database categories
    const grouped = categories.map(category => ({
      name: category.name,
      products: allProducts.filter(p => p.categoryId === category.id)
    })).filter(group => group.products.length > 0);
    
    return grouped;
  } catch (error) {
    console.error('Error fetching home page data:', error);
    return [];
  }
}

/**
 * Get product data for a specific product page
 */
export async function getProductPageData(id: string): Promise<{
  product: Product | null;
  relatedProducts: Product[];
}> {
  try {
    const product = await getProductById(id);
    
    if (!product) {
      return { product: null, relatedProducts: [] };
    }
    
    // Get related products from same category
    const categoryProducts = await getProductsByCategory(product.categoryId || '');
    const relatedProducts = categoryProducts
      .filter(p => p.id !== id)
      .slice(0, 4);
    
    return { product, relatedProducts };
  } catch (error) {
    console.error('Error fetching product page data:', error);
    return { product: null, relatedProducts: [] };
  }
}

/**
 * Get featured products for showcases
 */
export async function getFeaturedProductsData(): Promise<Product[]> {
  try {
    return await getFeaturedProducts();
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

/**
 * ============================================================================
 * CACHE INVALIDATION
 * ============================================================================
 */

/**
 * Invalidate product caches when product changes
 */
export async function invalidateProductCaches(productId?: string): Promise<void> {
  await invalidateRelated('product', productId);
}

/**
 * Clear all product-related caches
 */
export async function clearProductCaches(): Promise<void> {
  try {
    // Invalidate main product lists
    await Promise.all([
      cacheSet(CACHE_KEYS.productList(), null, 0),
      cacheSet(CACHE_KEYS.productList('featured'), null, 0),
    ]);
    
    // Invalidate related caches
    await invalidateRelated('product');
    
    console.log('[Products] All product caches cleared');
  } catch (error) {
    console.error('Error clearing product caches:', error);
  }
}
