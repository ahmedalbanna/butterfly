import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/health/ping
 * Simple health check endpoint used by connectivity detection
 * Returns 200 if server is reachable
 */
export async function HEAD(request: NextRequest) {
  try {
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}

/**
 * Also support GET for broader compatibility
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
