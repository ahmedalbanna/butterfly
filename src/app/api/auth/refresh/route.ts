import { NextRequest, NextResponse } from 'next/server';
import { getRefreshToken, verifyJWT, createTokens, setAuthCookies, isTokenBlacklisted } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // Accept refresh token from POST body (mobile) or cookies (web)
    // Priority: body parameter → cookie fallback
    const body = await req.json().catch(() => ({}));
    const refreshToken = body.refreshToken || await getRefreshToken();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token' },
        { status: 401 }
      );
    }

    // Check if refresh token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      return NextResponse.json(
        { error: 'Refresh token has been revoked' },
        { status: 401 }
      );
    }

    // Verify refresh token
    const decoded = verifyJWT(refreshToken);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create new tokens
    const { accessToken, refreshToken: newRefreshToken } = createTokens({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    // Set new cookies (for web clients)
    await setAuthCookies(accessToken, newRefreshToken);

    // Return tokens in response body for mobile clients
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
        },
        accessToken,        // Added for mobile compatibility
        refreshToken: newRefreshToken,  // Added for mobile compatibility
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Auth Refresh]', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
