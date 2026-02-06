'use server';

import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

/**
 * Create a new custom order request with photo uploads
 */
export async function createCustomOrder(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  customOrderId?: string;
}> {
  try {
    // Extract form fields
    const customerName = formData.get('customerName') as string;
    const customerEmail = formData.get('customerEmail') as string;
    const customerPhone = formData.get('customerPhone') as string | null;
    const description = formData.get('description') as string;
    const customerId = formData.get('customerId') as string | null;

    // Validate required fields
    if (!customerName || !customerEmail || !description) {
      return { success: false, error: 'Missing required fields' };
    }

    // Handle image uploads
    const files = formData.getAll('images') as File[];
    
    if (!files || files.length === 0) {
      return { success: false, error: 'At least one reference image is required' };
    }

    if (files.length > 5) {
      return { success: false, error: 'Maximum 5 images allowed' };
    }

    // Validate all files are images
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        return { success: false, error: `File ${file.name} is not an image` };
      }
    }

    // Create directory if it doesn't exist
    const customOrdersDir = path.join(process.cwd(), 'public', 'custom-orders');
    try {
      await mkdir(customOrdersDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Save images and collect URLs
    const imageUrls: string[] = [];
    
    for (const file of files) {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `custom-${timestamp}-${sanitizedName}`;
      const filepath = path.join(customOrdersDir, filename);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      imageUrls.push(`/custom-orders/${filename}`);
    }

    // Create custom order in database
    const customOrder = await prisma.customOrder.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        description,
        referenceImages: imageUrls,
        customerId: customerId || undefined,
        status: 'pending',
      },
    });

    revalidatePath('/admin/orders');

    return {
      success: true,
      customOrderId: customOrder.id,
    };
  } catch (error) {
    console.error('Error creating custom order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create custom order',
    };
  }
}

/**
 * Get all custom orders for admin dashboard
 */
export async function getCustomOrdersForAdmin(): Promise<{
  success: boolean;
  customOrders?: any[];
  error?: string;
}> {
  try {
    const customOrders = await prisma.customOrder.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            total: true,
          },
        },
      },
    });

    return {
      success: true,
      customOrders,
    };
  } catch (error) {
    console.error('Error fetching custom orders:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch custom orders',
    };
  }
}

/**
 * Get a single custom order by ID
 */
export async function getCustomOrderById(id: string): Promise<{
  success: boolean;
  customOrder?: any;
  error?: string;
}> {
  try {
    const customOrder = await prisma.customOrder.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customOrder) {
      return {
        success: false,
        error: 'Custom order not found',
      };
    }

    return {
      success: true,
      customOrder,
    };
  } catch (error) {
    console.error('Error fetching custom order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch custom order',
    };
  }
}

/**
 * Get custom orders for a specific user
 */
export async function getCustomOrdersForUser(userId: string): Promise<{
  success: boolean;
  customOrders?: any[];
  error?: string;
}> {
  try {
    const customOrders = await prisma.customOrder.findMany({
      where: {
        customerId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            total: true,
          },
        },
      },
    });

    return {
      success: true,
      customOrders,
    };
  } catch (error) {
    console.error('Error fetching user custom orders:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch custom orders',
    };
  }
}

/**
 * Admin provides a quote for a custom order
 */
export async function updateCustomOrderQuote(
  id: string,
  quotedPrice: number,
  quoteNotes?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await prisma.customOrder.update({
      where: { id },
      data: {
        quotedPrice,
        quoteNotes,
        status: 'quoted',
        quotedAt: new Date(),
      },
    });

    revalidatePath('/admin/orders');
    revalidatePath(`/custom-order/${id}`);

    return { success: true };
  } catch (error) {
    console.error('Error updating quote:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update quote',
    };
  }
}

/**
 * Customer approves the quote
 */
export async function approveCustomOrder(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await prisma.customOrder.update({
      where: { id },
      data: {
        status: 'approved',
        approvedAt: new Date(),
      },
    });

    revalidatePath('/admin/orders');
    revalidatePath(`/custom-order/${id}`);

    return { success: true };
  } catch (error) {
    console.error('Error approving custom order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve custom order',
    };
  }
}

/**
 * Update custom order status (admin)
 */
export async function updateCustomOrderStatus(
  id: string,
  status: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const updateData: any = { status };

    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    await prisma.customOrder.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/admin/orders');
    revalidatePath(`/custom-order/${id}`);

    return { success: true };
  } catch (error) {
    console.error('Error updating status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status',
    };
  }
}

/**
 * Get count of pending custom orders (for admin badge)
 */
export async function getPendingCustomOrdersCount(): Promise<number> {
  try {
    const count = await prisma.customOrder.count({
      where: {
        status: 'pending',
      },
    });
    return count;
  } catch (error) {
    console.error('Error counting pending custom orders:', error);
    return 0;
  }
}
