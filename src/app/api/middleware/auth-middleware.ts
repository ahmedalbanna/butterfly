import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyUserFromRequest, JWTPayload } from '@/lib/auth';

/**
 * Authentication middleware wrapper for protected endpoints
 * Supports both Authorization header (Bearer token) and cookies
 * 
 * @param req - NextRequest object
 * @param handler - Async function that handles the request with authenticated user
 * @returns NextResponse with user data or error
 * 
 * @example
 * export async function GET(req: NextRequest) {
 *   return withAuth(req, async (user) => {
 *     // Your endpoint logic here
 *     const data = await fetchUserData(user.userId);
 *     return NextResponse.json({ success: true, data });
 *   });
 * }
 */
export async function withAuth(
  req: NextRequest,
  handler: (user: JWTPayload) => Promise<Response>
): Promise<Response> {
  try {
    // Extract token from Authorization header or cookies
    const { token, error: tokenError } = await getTokenFromRequest(req);

    // Return 400 if Authorization header is malformed
    if (tokenError) {
      return NextResponse.json(
        { success: false, error: tokenError },
        { status: 400 }
      );
    }

    // Verify user from the extracted token
    const user = await verifyUserFromRequest(req);

    // Return 401 if not authenticated
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Call the handler with authenticated user
    return await handler(user);
  } catch (error) {
    console.error('[Auth Middleware]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to authenticate' },
      { status: 500 }
    );
  }
}

/**
 * Alternative: Minimal middleware that just validates auth
 * Use this if you need more control over response format
 * 
 * @param req - NextRequest object
 * @returns { user, error } - User payload or error response
 */
export async function validateAuth(req: NextRequest): Promise<{
  user: JWTPayload | null;
  errorResponse?: Response;
}> {
  try {
    // Extract token
    const { token, error: tokenError } = await getTokenFromRequest(req);

    if (tokenError) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { success: false, error: tokenError },
          { status: 400 }
        ),
      };
    }

    // Verify user
    const user = await verifyUserFromRequest(req);

    if (!user) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { success: false, error: 'Not authenticated' },
          { status: 401 }
        ),
      };
    }

    return { user };
  } catch (error) {
    console.error('[Validate Auth]', error);
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'Failed to authenticate' },
        { status: 500 }
      ),
    };
  }
}
