/**
 * Email Service - Sends authentication-related emails
 * Supports multiple providers (configured via environment variables)
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using configured provider
 * Supports: SendGrid, Resend, Nodemailer, or console logging (development)
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const provider = process.env.EMAIL_PROVIDER || 'console';

  try {
    switch (provider) {
      case 'sendgrid':
        return await sendViaSendGrid(options);
      case 'resend':
        return await sendViaResend(options);
      case 'nodemailer':
        return await sendViaNodemailer(options);
      case 'console':
      default:
        return sendViaConsole(options);
    }
  } catch (error) {
    console.error('[Email Service]', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * SendGrid integration
 */
async function sendViaMailjet(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  // Using Mailjet (free tier available)
  const MAILJET_API_KEY = process.env.MAILJET_API_KEY;
  const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@butterflystore.com';

  if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
    console.warn('[Email] Mailjet credentials not configured');
    return { success: false, error: 'Email service not configured' };
  }

  const auth = Buffer.from(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`).toString('base64');

  try {
    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        Messages: [
          {
            From: { Email: FROM_EMAIL },
            To: [{ Email: options.to }],
            Subject: options.subject,
            HTMLPart: options.html,
            TextPart: options.text || stripHtml(options.html),
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Mailjet Error]', error);
      return { success: false, error: 'Failed to send email via Mailjet' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Mailjet]', error);
    return { success: false, error: 'Email service error' };
  }
}

/**
 * Resend integration (modern email service)
 */
async function sendViaResend(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@butterflystore.com';

  if (!RESEND_API_KEY) {
    console.warn('[Email] Resend API key not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Resend Error]', error);
      return { success: false, error: 'Failed to send email via Resend' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Resend]', error);
    return { success: false, error: 'Email service error' };
  }
}

/**
 * Generic SMTP via Nodemailer
 */
async function sendViaNodemailer(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  // This would require nodemailer package
  console.warn('[Email] Nodemailer integration requires additional setup');
  return { success: false, error: 'Nodemailer not configured' };
}

/**
 * Console logging (development)
 */
function sendViaConsole(options: EmailOptions): { success: boolean; error?: string } {
  console.log('\n' + '='.repeat(60));
  console.log('[EMAIL - Development Mode]');
  console.log(`To: ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log('-'.repeat(60));
  console.log(options.html);
  console.log('='.repeat(60) + '\n');
  return { success: true };
}

/**
 * Email template: Password Reset
 */
export function getPasswordResetTemplate(resetLink: string, userName: string = 'Valued Collector'): { subject: string; html: string; text: string } {
  return {
    subject: 'Reset Your Butterfly Store Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Alegreya', serif; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #ffd700; }
            .header h1 { color: #ffd700; margin: 0; font-size: 28px; }
            .content { padding: 30px 20px; background: white; }
            .button { display: inline-block; padding: 12px 30px; background: #ffd700; color: black; text-decoration: none; font-weight: bold; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🦋 Butterfly Store</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>We received a request to reset your password. Click the link below to create a new password.</p>
              <a href="${resetLink}" class="button">Reset Password</a>
              <p><strong>This link expires in 1 hour.</strong></p>
              <p>If you didn't request this, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Butterfly Store. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hello ${userName},\n\nWe received a request to reset your password. Click the link below:\n\n${resetLink}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.`,
  };
}

/**
 * Email template: Welcome
 */
export function getWelcomeTemplate(userName: string = 'Valued Collector'): { subject: string; html: string; text: string } {
  return {
    subject: 'Welcome to Butterfly Store',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Alegreya', serif; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #ffd700; }
            .header h1 { color: #ffd700; margin: 0; font-size: 28px; }
            .content { padding: 30px 20px; background: white; }
            .button { display: inline-block; padding: 12px 30px; background: #ffd700; color: black; text-decoration: none; font-weight: bold; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🦋 Butterfly Store</h1>
            </div>
            <div class="content">
              <p>Welcome to Butterfly Store, ${userName}!</p>
              <p>Your account has been created successfully. You now have access to our exclusive collection of luxury accessories.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://butterflystore.com'}" class="button">Visit Store</a>
              <p>Thank you for joining our community of elegant collectors.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Butterfly Store. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to Butterfly Store, ${userName}!\n\nYour account has been created successfully. Visit our store at ${process.env.NEXT_PUBLIC_APP_URL || 'https://butterflystore.com'}`,
  };
}

/**
 * Email template: Email Verification
 */
export function getVerificationTemplate(verificationLink: string, userName: string = 'Valued Collector'): { subject: string; html: string; text: string } {
  return {
    subject: 'Verify Your Butterfly Store Email',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Alegreya', serif; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #ffd700; }
            .header h1 { color: #ffd700; margin: 0; font-size: 28px; }
            .content { padding: 30px 20px; background: white; }
            .button { display: inline-block; padding: 12px 30px; background: #ffd700; color: black; text-decoration: none; font-weight: bold; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🦋 Butterfly Store</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>Thank you for creating your Butterfly Store account. Please verify your email address by clicking the link below:</p>
              <a href="${verificationLink}" class="button">Verify Email</a>
              <p><strong>This link expires in 24 hours.</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Butterfly Store. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hello ${userName},\n\nPlease verify your email by clicking: ${verificationLink}\n\nThis link expires in 24 hours.`,
  };
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}
