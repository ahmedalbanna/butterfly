/**
 * Authentication Error Definitions
 * Standardized error codes and messages for auth operations
 */

export enum AuthErrorCode {
  // Registration errors
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVALID_EMAIL = 'INVALID_EMAIL',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  PASSWORD_MISMATCH = 'PASSWORD_MISMATCH',

  // Login errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  FIREBASE_USER = 'FIREBASE_USER',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',

  // Token errors
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  MISSING_TOKEN = 'MISSING_TOKEN',

  // Authorization errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // Password reset errors
  INVALID_RESET_TOKEN = 'INVALID_RESET_TOKEN',
  RESET_TOKEN_EXPIRED = 'RESET_TOKEN_EXPIRED',
  RESET_TOKEN_USED = 'RESET_TOKEN_USED',

  // Server errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  // Rate limiting
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  RATE_LIMITED = 'RATE_LIMITED',
}

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}

/**
 * Create a standardized auth error
 */
export function createAuthError(code: AuthErrorCode, details?: Record<string, any>): AuthError {
  const errorMap: Record<AuthErrorCode, { message: string; statusCode: number }> = {
    // Registration
    [AuthErrorCode.EMAIL_ALREADY_EXISTS]: {
      message: 'An account with this email already exists',
      statusCode: 409,
    },
    [AuthErrorCode.INVALID_EMAIL]: {
      message: 'Please provide a valid email address',
      statusCode: 400,
    },
    [AuthErrorCode.WEAK_PASSWORD]: {
      message: 'Password does not meet security requirements',
      statusCode: 400,
    },
    [AuthErrorCode.PASSWORD_MISMATCH]: {
      message: 'Passwords do not match',
      statusCode: 400,
    },

    // Login
    [AuthErrorCode.USER_NOT_FOUND]: {
      message: 'Invalid email or password',
      statusCode: 401,
    },
    [AuthErrorCode.INVALID_PASSWORD]: {
      message: 'Invalid email or password',
      statusCode: 401,
    },
    [AuthErrorCode.FIREBASE_USER]: {
      message: 'This account uses Firebase authentication. Please migrate your account first.',
      statusCode: 401,
    },
    [AuthErrorCode.ACCOUNT_LOCKED]: {
      message: 'Your account is locked due to multiple failed login attempts. Please try again later.',
      statusCode: 401,
    },

    // Tokens
    [AuthErrorCode.INVALID_TOKEN]: {
      message: 'Invalid authentication token',
      statusCode: 401,
    },
    [AuthErrorCode.EXPIRED_TOKEN]: {
      message: 'Your session has expired. Please log in again.',
      statusCode: 401,
    },
    [AuthErrorCode.MISSING_TOKEN]: {
      message: 'Authentication required',
      statusCode: 401,
    },

    // Authorization
    [AuthErrorCode.UNAUTHORIZED]: {
      message: 'You must be logged in to access this resource',
      statusCode: 401,
    },
    [AuthErrorCode.FORBIDDEN]: {
      message: 'You do not have permission to access this resource',
      statusCode: 403,
    },

    // Password reset
    [AuthErrorCode.INVALID_RESET_TOKEN]: {
      message: 'Invalid or expired password reset link',
      statusCode: 400,
    },
    [AuthErrorCode.RESET_TOKEN_EXPIRED]: {
      message: 'Password reset link has expired. Please request a new one.',
      statusCode: 400,
    },
    [AuthErrorCode.RESET_TOKEN_USED]: {
      message: 'This password reset link has already been used',
      statusCode: 400,
    },

    // Server errors
    [AuthErrorCode.DATABASE_ERROR]: {
      message: 'A database error occurred. Please try again later.',
      statusCode: 500,
    },
    [AuthErrorCode.EMAIL_SERVICE_ERROR]: {
      message: 'Failed to send email. Please try again later.',
      statusCode: 500,
    },
    [AuthErrorCode.INTERNAL_ERROR]: {
      message: 'An unexpected error occurred. Please try again later.',
      statusCode: 500,
    },

    // Rate limiting
    [AuthErrorCode.TOO_MANY_ATTEMPTS]: {
      message: 'Too many attempts. Please try again later.',
      statusCode: 429,
    },
    [AuthErrorCode.RATE_LIMITED]: {
      message: 'Too many requests. Please slow down.',
      statusCode: 429,
    },
  };

  const error = errorMap[code] || errorMap[AuthErrorCode.INTERNAL_ERROR];

  return {
    code,
    message: error.message,
    statusCode: error.statusCode,
    details,
  };
}

/**
 * Check if error is a known auth error
 */
export function isAuthError(error: any): error is AuthError {
  return error && typeof error === 'object' && 'code' in error && 'statusCode' in error;
}
