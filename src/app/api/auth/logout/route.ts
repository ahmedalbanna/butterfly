import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies, getAccessToken, getRefreshToken, blacklistToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Get tokens before clearing cookies
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();

    // Blacklist both tokens to prevent reuse
    if (accessToken) {
      await blacklistToken(accessToken);
    }
    if (refreshToken) {
      await blacklistToken(refreshToken);
    }

    // Clear cookies
    await clearAuthCookies();

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Auth Logout]', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
