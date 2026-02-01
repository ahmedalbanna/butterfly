import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Trigger n8n workflow to publish product to social media
 * This endpoint is called from the LuxeFinds admin panel
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, platforms } = body;

    if (!productId || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: productId and platforms array' },
        { status: 400 }
      );
    }

    // Fetch product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Validate n8n configuration
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    const n8nApiKey = process.env.N8N_API_KEY;

    if (!n8nWebhookUrl || !n8nApiKey) {
      return NextResponse.json(
        { error: 'n8n configuration missing. Please set N8N_WEBHOOK_URL and N8N_API_KEY environment variables.' },
        { status: 500 }
      );
    }

    // Create pending social media posts in database
    const socialMediaPosts = await Promise.all(
      platforms.map((platform: string) =>
        prisma.socialMediaPost.create({
          data: {
            productId,
            platform: platform.toLowerCase(),
            status: 'pending',
          },
        })
      )
    );

    // Prepare payload for n8n
    const payload = {
      productId: product.id,
      productName: product.name,
      description: product.description,
      price: product.price,
      currency: 'USD',
      imageUrl: product.image,
      images: product.images,
      category: product.category.name,
      platforms,
      callbackUrl: `https://vmi2935537.contaboserver.net/rest/oauth2-credential/callback`,
      socialMediaPostIds: socialMediaPosts.map(p => ({ platform: p.platform, id: p.id })),
    };

    // Send to n8n webhook
    console.log('[n8n] Triggering workflow for product:', product.name);
    console.log('[n8n] Platforms:', platforms);

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${n8nApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('[n8n] Webhook failed:', errorText);

      // Mark posts as failed
      await Promise.all(
        socialMediaPosts.map(post =>
          prisma.socialMediaPost.update({
            where: { id: post.id },
            data: {
              status: 'failed',
              errorMessage: `n8n webhook failed: ${errorText}`,
            },
          })
        )
      );

      return NextResponse.json(
        { error: 'Failed to trigger n8n workflow', details: errorText },
        { status: 500 }
      );
    }

    const n8nResult = await n8nResponse.json();
    console.log('[n8n] Workflow triggered successfully:', n8nResult);

    return NextResponse.json({
      success: true,
      message: `Publish request sent to n8n for ${platforms.length} platform(s)`,
      socialMediaPosts: socialMediaPosts.map(p => ({
        id: p.id,
        platform: p.platform,
        status: p.status,
      })),
      n8nResponse: n8nResult,
    });
  } catch (error) {
    console.error('[n8n Publish] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
