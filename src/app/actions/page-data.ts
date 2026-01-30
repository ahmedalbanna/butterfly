'use server';

import { getProducts, getProductById, getProductsByCategory, getFeaturedProducts } from './products';
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
    const allProducts = await getProducts();
    
    // Group by category
    const categories = ['Jewelry', 'Watches', 'Bags', 'Accessories'];
    const grouped = categories.map(category => ({
      name: category,
      products: allProducts.filter(p => p.category === category)
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
