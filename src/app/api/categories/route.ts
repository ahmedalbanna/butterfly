import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/categories
 * Fetch all product categories
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('[Categories List] Fetching categories...');
    
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        displayOrder: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    const duration = Date.now() - startTime;
    console.log(`[Categories List] Query completed in ${duration}ms, found ${categories.length} categories`);

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Categories List] Error after ${duration}ms:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
