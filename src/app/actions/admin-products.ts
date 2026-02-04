'use server';

import { prisma } from '@/lib/db';
import { Product, SocialMediaPost } from '@prisma/client';
import { productImageAnalyzerFlow } from '@/ai/flows/product-image-analyzer-flow';
import { generateProductModelPhotoFlow } from '@/ai/flows/generate-product-model-photo';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export type CreateProductData = {
  name: string;
  categoryId: string;
  price: number;
  description: string;
  materials: string;
  care: string;
  image: string;
  images?: string[];
  video?: string;
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
        video: data.video || null,
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

/**
 * Generate product details from an image using AI
 */
export async function generateProductFromImage(formData: FormData): Promise<{
  success: boolean;
  data?: {
    name: string;
    description: string;
    category: string;
    suggestedPrice?: number;
    imageUrl: string;
  };
  error?: string;
}> {
  try {
    const file = formData.get('image') as File;
    
    if (!file) {
      return { success: false, error: 'No image file provided' };
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' };
    }

    // Create products directory if it doesn't exist
    const productsDir = path.join(process.cwd(), 'public', 'products');
    if (!existsSync(productsDir)) {
      await mkdir(productsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${sanitizedName}`;
    const filepath = path.join(productsDir, filename);

    // Save the file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate public URL
    const imageUrl = `/products/${filename}`;
    
    // Call AI flow to analyze the image
    console.log('Calling AI flow to analyze image...');
    const aiResult = await productImageAnalyzerFlow({
      imageUrl: path.join(process.cwd(), 'public', 'products', filename)
    });

    console.log('AI analysis result:', aiResult);

    return {
      success: true,
      data: {
        name: aiResult.name,
        description: aiResult.description,
        category: aiResult.category,
        suggestedPrice: aiResult.suggestedPrice,
        imageUrl: imageUrl,
      }
    };
  } catch (error) {
    console.error('Error generating product from image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze image'
    };
  }
}

/**
 * Generate product details from multiple images using AI (batch processing)
 */
export async function generateProductsFromMultipleImages(formData: FormData): Promise<{
  success: boolean;
  results?: Array<{
    id: string;
    fileName: string;
    success: boolean;
    data?: {
      name: string;
      description: string;
      category: string;
      suggestedPrice?: number;
      imageUrl: string;
    };
    error?: string;
  }>;
  error?: string;
}> {
  try {
    const files = formData.getAll('images') as File[];
    
    if (!files || files.length === 0) {
      return { success: false, error: 'No image files provided' };
    }

    // Validate all files are images
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        return { success: false, error: `File ${file.name} is not an image` };
      }
    }

    // Create products directory if it doesn't exist
    const productsDir = path.join(process.cwd(), 'public', 'products');
    if (!existsSync(productsDir)) {
      await mkdir(productsDir, { recursive: true });
    }

    const results = [];

    // Process each image sequentially
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `draft-${Date.now()}-${i}`;
      
      try {
        // Generate unique filename
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}-${sanitizedName}`;
        const filepath = path.join(productsDir, filename);

        // Save the file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Generate public URL
        const imageUrl = `/products/${filename}`;
        
        // Call AI flow to analyze the image
        console.log(`Analyzing image ${i + 1}/${files.length}: ${file.name}`);
        const aiResult = await productImageAnalyzerFlow({
          imageUrl: path.join(process.cwd(), 'public', 'products', filename)
        });

        results.push({
          id,
          fileName: file.name,
          success: true,
          data: {
            name: aiResult.name,
            description: aiResult.description,
            category: aiResult.category,
            suggestedPrice: aiResult.suggestedPrice,
            imageUrl: imageUrl,
          }
        });
      } catch (error) {
        console.error(`Error analyzing image ${file.name}:`, error);
        results.push({
          id,
          fileName: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Failed to analyze image'
        });
      }
    }

    return {
      success: true,
      results
    };
  } catch (error) {
    console.error('Error processing multiple images:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process images'
    };
  }
}

/**
 * Publish product to social media platforms via n8n
 */
export async function publishProductToSocial(
  productId: string,
  platforms: string[]
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!platforms || platforms.length === 0) {
      return { success: false, error: 'No platforms selected' };
    }

    // Validate platforms
    const validPlatforms = ['facebook', 'instagram', 'twitter', 'pinterest', 'tiktok'];
    const invalidPlatforms = platforms.filter(p => !validPlatforms.includes(p.toLowerCase()));
    
    if (invalidPlatforms.length > 0) {
      return {
        success: false,
        error: `Invalid platforms: ${invalidPlatforms.join(', ')}`
      };
    }

    // Call the webhook endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/webhooks/n8n/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId,
        platforms: platforms.map(p => p.toLowerCase()),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Failed to publish to social media'
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error publishing to social media:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish to social media'
    };
  }
}

/**
 * Get social media posts for a product or all products
 */
export async function getSocialMediaPosts(
  productId?: string
): Promise<Array<SocialMediaPost & { product: { name: string; image: string } }>> {
  try {
    const posts = await prisma.socialMediaPost.findMany({
      where: productId ? { productId } : undefined,
      include: {
        product: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return posts;
  } catch (error) {
    console.error('Error fetching social media posts:', error);
    return [];
  }
}

/**
 * Get social media post statistics
 */
export async function getSocialMediaStats(): Promise<{
  totalPosts: number;
  publishedPosts: number;
  pendingPosts: number;
  failedPosts: number;
  byPlatform: Record<string, number>;
}> {
  try {
    const [totalPosts, publishedPosts, pendingPosts, failedPosts, allPosts] = await Promise.all([
      prisma.socialMediaPost.count(),
      prisma.socialMediaPost.count({ where: { status: 'published' } }),
      prisma.socialMediaPost.count({ where: { status: 'pending' } }),
      prisma.socialMediaPost.count({ where: { status: 'failed' } }),
      prisma.socialMediaPost.findMany({ select: { platform: true } }),
    ]);

    const byPlatform: Record<string, number> = {};
    allPosts.forEach(post => {
      byPlatform[post.platform] = (byPlatform[post.platform] || 0) + 1;
    });

    return {
      totalPosts,
      publishedPosts,
      pendingPosts,
      failedPosts,
      byPlatform,
    };
  } catch (error) {
    console.error('Error fetching social media stats:', error);
    return {
      totalPosts: 0,
      publishedPosts: 0,
      pendingPosts: 0,
      failedPosts: 0,
      byPlatform: {},
    };
  }
}

/**
 * Retry a failed social media post
 */
export async function retrySocialMediaPost(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const post = await prisma.socialMediaPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return { success: false, error: 'Post not found' };
    }

    if (post.status !== 'failed') {
      return { success: false, error: 'Only failed posts can be retried' };
    }

    // Reset post to pending and trigger republish
    await prisma.socialMediaPost.update({
      where: { id: postId },
      data: {
        status: 'pending',
        errorMessage: null,
        postUrl: null,
      },
    });

    // Republish to the single platform
    const result = await publishProductToSocial(post.productId, [post.platform]);
    return result;
  } catch (error) {
    console.error('Error retrying social media post:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retry post'
    };
  }
}

/**
 * Generate a model photo for a product using AI
 */
export async function generateModelPhoto(
  productId: string,
  style?: 'elegant' | 'casual' | 'editorial' | 'luxury'
): Promise<{ success: boolean; imageBase64?: string; prompt?: string; error?: string }> {
  try {
    // Fetch the product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: {
          select: {
            name: true
          }
        }
      }
    });

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    console.log(`Generating model photo for product: ${product.name}`);

    // Call the AI flow to generate the model photo
    const result = await generateProductModelPhotoFlow({
      productName: product.name,
      productCategory: product.category.name,
      productDescription: product.description,
      style: style || 'luxury',
    });

    console.log('Model photo generated successfully');

    return {
      success: true,
      imageBase64: result.imageBase64,
      prompt: result.prompt,
    };
  } catch (error) {
    console.error('Error generating model photo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate model photo'
    };
  }
}

/**
 * Save a generated model photo to a product
 */
export async function saveProductModelImage(
  productId: string,
  imageBase64: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    // Create model-images directory if it doesn't exist
    const modelImagesDir = path.join(process.cwd(), 'public', 'model-images');
    if (!existsSync(modelImagesDir)) {
      await mkdir(modelImagesDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `model-${productId}-${timestamp}.png`;
    const filepath = path.join(modelImagesDir, filename);

    // Convert base64 to buffer and save
    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    await writeFile(filepath, buffer);

    // Generate public URL
    const imageUrl = `/model-images/${filename}`;

    // Update the product with the new model image
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { modelImages: true }
    });

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    await prisma.product.update({
      where: { id: productId },
      data: {
        modelImages: [...product.modelImages, imageUrl]
      }
    });

    console.log(`Model image saved for product ${productId}: ${imageUrl}`);

    return {
      success: true,
      imageUrl
    };
  } catch (error) {
    console.error('Error saving model image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save model image'
    };
  }
}

/**
 * Delete a model image from a product
 */
export async function deleteProductModelImage(
  productId: string,
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { modelImages: true }
    });

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    // Remove the image URL from the array
    const updatedModelImages = product.modelImages.filter(img => img !== imageUrl);

    await prisma.product.update({
      where: { id: productId },
      data: {
        modelImages: updatedModelImages
      }
    });

    console.log(`Model image removed from product ${productId}: ${imageUrl}`);

    return { success: true };
  } catch (error) {
    console.error('Error deleting model image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete model image'
    };
  }
}
