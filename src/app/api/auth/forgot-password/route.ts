import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateSecureToken, isValidEmail, getClientIp } from '@/lib/auth-middleware';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendEmail, getPasswordResetTemplate } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Rate limiting - max 5 attempts per 15 minutes per IP
    const clientIp = getClientIp(req);
    const rateLimitKey = `forgot-password:${clientIp}`;
    const { allowed, remaining, resetTime } = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

    if (!allowed) {
      return NextResponse.json(
        { 
          error: 'Too many password reset attempts. Please try again later.',
          resetTime: new Date(resetTime).toISOString(),
        },
        { status: 429 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists for security
    if (!user) {
      return NextResponse.json(
        { success: true, message: 'If an account exists, a reset link has been sent.' },
        { status: 200 }
      );
    }

    // Generate secure reset token (valid for 1 hour)
    const resetToken = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to database
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: expiresAt,
      },
    });

    // Build reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Send email
    const template = getPasswordResetTemplate(resetLink, user.name || 'Valued Collector');
    const emailResult = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!emailResult.success) {
      console.error('[Forgot Password] Email send failed:', emailResult.error);
      // Still return success to not reveal email issues
    }

    return NextResponse.json(
      { success: true, message: 'If an account exists, a reset link has been sent.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Forgot Password]', error);
    return NextResponse.json(
      { error: 'Failed to process password reset' },
      { status: 500 }
    );
  }
}
