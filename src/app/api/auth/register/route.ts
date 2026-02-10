import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, createTokens, setAuthCookies } from '@/lib/auth';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';
import { isValidEmail, getClientIp, validatePasswordStrength } from '@/lib/auth-middleware';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

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

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Password does not meet security requirements', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Rate limiting - max 5 registrations per hour per IP
    const clientIp = getClientIp(req);
    const rateLimitKey = `register:${clientIp}`;
    const { allowed, resetTime } = checkRateLimit(rateLimitKey, 5, 60 * 60 * 1000);

    if (!allowed) {
      return NextResponse.json(
        { 
          error: 'Too many registration attempts. Please try again later.',
          resetTime: new Date(resetTime).toISOString(),
        },
        { status: 429 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        isAdmin: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
      },
    });

    // Create tokens
    const { accessToken, refreshToken } = createTokens({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    // Set cookies
    await setAuthCookies(accessToken, refreshToken);

    // Reset rate limit on successful registration
    resetRateLimit(rateLimitKey);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Auth Register]', error);
    return NextResponse.json(
      { error: 'Failed to register' },
      { status: 500 }
    );
  }
}
