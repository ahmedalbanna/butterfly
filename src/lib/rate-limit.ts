/**
 * Simple in-memory rate limiter for authentication endpoints
 * For production, use Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const limiter = new Map<string, RateLimitEntry>();

/**
 * Check if a request should be rate limited
 * @param key - Unique identifier (IP, email, etc.)
 * @param maxAttempts - Maximum attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns Object with allowed flag and remaining attempts
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = limiter.get(key);

  // Create new entry if doesn't exist
  if (!entry) {
    limiter.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetTime: now + windowMs };
  }

  // Reset if window has passed
  if (now > entry.resetTime) {
    limiter.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetTime: now + windowMs };
  }

  // Check if over limit
  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  // Increment counter
  entry.count++;
  return { allowed: true, remaining: maxAttempts - entry.count, resetTime: entry.resetTime };
}

/**
 * Reset rate limit for a specific key
 */
export function resetRateLimit(key: string): void {
  limiter.delete(key);
}

/**
 * Clear all rate limit entries (useful for testing)
 */
export function clearRateLimits(): void {
  limiter.clear();
}

/**
 * Clean up expired entries (run periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of limiter.entries()) {
    if (now > entry.resetTime) {
      limiter.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof global !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
