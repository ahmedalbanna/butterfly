'use server';

import { prisma } from '@/lib/db';
import { Category } from '@prisma/client';

/**
 * Get all categories
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' }
    });
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Get a single category by ID
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
    return category;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

/**
 * Get a category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const category = await prisma.category.findUnique({
      where: { slug }
    });
    return category;
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    return null;
  }
}

/**
 * Create a new category
 */
export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
  displayOrder?: number;
}): Promise<Category | null> {
  try {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        displayOrder: data.displayOrder ?? 0
      }
    });
    return category;
  } catch (error) {
    console.error('Error creating category:', error);
    return null;
  }
}

/**
 * Update a category
 */
export async function updateCategory(
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    displayOrder?: number;
  }
): Promise<Category | null> {
  try {
    const category = await prisma.category.update({
      where: { id },
      data
    });
    return category;
  } catch (error) {
    console.error('Error updating category:', error);
    return null;
  }
}

/**
 * Delete a category (only if no products are associated)
 */
export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if category has products
    const productsCount = await prisma.product.count({
      where: { categoryId: id }
    });

    if (productsCount > 0) {
      return {
        success: false,
        error: `Cannot delete category with ${productsCount} associated products`
      };
    }

    await prisma.category.delete({
      where: { id }
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return {
      success: false,
      error: 'Failed to delete category'
    };
  }
}

/**
 * Get categories with product counts
 */
export async function getCategoriesWithCounts(): Promise<Array<Category & { productCount: number }>> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    return categories.map(cat => ({
      ...cat,
      productCount: cat._count.products
    }));
  } catch (error) {
    console.error('Error fetching categories with counts:', error);
    return [];
  }
}
