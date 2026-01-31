'use server';

import { prisma } from '@/lib/db';
import { Product } from '@prisma/client';

export type CreateProductData = {
  name: string;
  categoryId: string;
  price: number;
  description: string;
  materials: string;
  care: string;
  image: string;
  images?: string[];
  featured?: boolean;
  stock?: number;
};

export type UpdateProductData = Partial<CreateProductData>;

/**
 * Create a new product
 */
export async function createProduct(data: CreateProductData): Promise<Product | null> {
  try {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        price: data.price,
        description: data.description,
        materials: data.materials,
        care: data.care,
        image: data.image,
        images: data.images || [data.image],
        featured: data.featured ?? false,
        stock: data.stock ?? 100
      }
    });
    return product;
  } catch (error) {
    console.error('Error creating product:', error);
    return null;
  }
}

/**
 * Update a product
 */
export async function updateProduct(id: string, data: UpdateProductData): Promise<Product | null> {
  try {
    const product = await prisma.product.update({
      where: { id },
      data
    });
    return product;
  } catch (error) {
    console.error('Error updating product:', error);
    return null;
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if product is in any orders
    const orderItemsCount = await prisma.orderItem.count({
      where: { productId: id }
    });

    if (orderItemsCount > 0) {
      return {
        success: false,
        error: `Cannot delete product with ${orderItemsCount} order references`
      };
    }

    await prisma.product.delete({
      where: { id }
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return {
      success: false,
      error: 'Failed to delete product'
    };
  }
}

/**
 * Get all products with category information for admin
 */
export async function getAllProductsForAdmin(): Promise<Array<Product & { category: { name: string } }>> {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    return products;
  } catch (error) {
    console.error('Error fetching products for admin:', error);
    return [];
  }
}

/**
 * Toggle product featured status
 */
export async function toggleProductFeatured(id: string): Promise<Product | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) return null;

    const updated = await prisma.product.update({
      where: { id },
      data: { featured: !product.featured }
    });

    return updated;
  } catch (error) {
    console.error('Error toggling product featured status:', error);
    return null;
  }
}

/**
 * Update product stock
 */
export async function updateProductStock(id: string, stock: number): Promise<Product | null> {
  try {
    const product = await prisma.product.update({
      where: { id },
      data: { stock }
    });
    return product;
  } catch (error) {
    console.error('Error updating product stock:', error);
    return null;
  }
}
