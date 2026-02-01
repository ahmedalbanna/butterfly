import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Receive status updates from n8n after social media publishing
 * This endpoint is called by n8n workflows
 */
export async function POST(request: NextRequest) {
  try {
    // Verify callback secret
    const authHeader = request.headers.get('authorization');
    const callbackSecret = process.env.LUXEFINDS_CALLBACK_SECRET;

    if (!callbackSecret) {
      console.error('[n8n Callback] LUXEFINDS_CALLBACK_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${callbackSecret}`) {
      console.error('[n8n Callback] Invalid authorization header');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { socialMediaPostId, platform, status, postUrl, errorMessage, metadata } = body;

    if (!socialMediaPostId || !platform || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: socialMediaPostId, platform, status' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'published', 'failed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Find the social media post
    const post = await prisma.socialMediaPost.findUnique({
      where: { id: socialMediaPostId },
      include: {
        product: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Social media post not found' },
        { status: 404 }
      );
    }

    // Update the post status
    const updatedPost = await prisma.socialMediaPost.update({
      where: { id: socialMediaPostId },
      data: {
        status,
        postUrl: postUrl || null,
        errorMessage: errorMessage || null,
        metadata: metadata || null,
        publishedAt: status === 'published' ? new Date() : null,
      },
    });

    console.log(`[n8n Callback] Updated post ${socialMediaPostId} - ${platform}: ${status}`);
    if (postUrl) {
      console.log(`[n8n Callback] Post URL: ${postUrl}`);
    }
    if (errorMessage) {
      console.error(`[n8n Callback] Error: ${errorMessage}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully',
      post: {
        id: updatedPost.id,
        productName: post.product.name,
        platform: updatedPost.platform,
        status: updatedPost.status,
        postUrl: updatedPost.postUrl,
        publishedAt: updatedPost.publishedAt,
      },
    });
  } catch (error) {
    console.error('[n8n Callback] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
