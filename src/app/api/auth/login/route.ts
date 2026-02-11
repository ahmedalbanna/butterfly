import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, createTokens, setAuthCookies } from '@/lib/auth';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';
import { isValidEmail, getClientIp } from '@/lib/auth-middleware';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Rate limiting - max 10 attempts per 15 minutes per IP
    const clientIp = getClientIp(req);
    const rateLimitKey = `login:${clientIp}:${email}`;
    const { allowed, resetTime } = checkRateLimit(rateLimitKey, 10, 15 * 60 * 1000);

    if (!allowed) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          resetTime: new Date(resetTime).toISOString(),
        },
        { status: 429 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        isAdmin: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await verifyPassword(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create tokens
    const { accessToken, refreshToken } = createTokens({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    // Set cookies (for web clients)
    await setAuthCookies(accessToken, refreshToken);

    // Reset rate limit on successful login
    resetRateLimit(rateLimitKey);

    // Return tokens in response body for mobile clients (Flutter, etc.)
    // while maintaining cookie-based auth for web clients
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
        },
        accessToken,   // Added for mobile compatibility
        refreshToken,  // Added for mobile compatibility
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Auth Login]', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
