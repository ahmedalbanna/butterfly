import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Extract token from Authorization header or cookies
    const { token, error: tokenError } = await getTokenFromRequest(req);

    // Check for malformed Authorization header
    if (tokenError) {
      return NextResponse.json(
        { error: tokenError },
        { status: 400 }
      );
    }

    // Verify user from the extracted token
    const jwtPayload = await verifyUserFromRequest(req);

    if (!jwtPayload) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch full user data from database
    const user = await prisma.user.findUnique({
      where: { id: jwtPayload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('[Auth Me]', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}
