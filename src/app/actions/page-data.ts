'use server';

import { getProducts, getProductById, getProductsByCategory, getFeaturedProducts } from './products';
import { getCategories } from './categories';
import { Product } from '@prisma/client';

export type GroupedProducts = {
  name: string;
  products: Product[];
};

/**
 * Get all products grouped by category for the home page
 */
export async function getHomePageData(): Promise<GroupedProducts[]> {
  try {
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
    const categoryProducts = await getProductsByCategory(product.category);
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
