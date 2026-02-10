# PostgreSQL Authentication Migration Guide

## Overview

This document outlines the migration from Firebase Authentication to PostgreSQL-based authentication for the Butterfly Store. The system uses JWT tokens stored in httpOnly cookies for secure, stateless session management.

## Architecture Changes

### Before (Firebase)
- Authentication: Firebase Auth (email/password, OAuth, etc.)
- User Data: Firestore (roles, profiles)
- Session Management: Firebase client-side auth state
- Role Storage: Firestore documents

### After (PostgreSQL)
- Authentication: PostgreSQL + bcryptjs (password hashing)
- User Data: PostgreSQL (unified storage)
- Session Management: JWT tokens in httpOnly cookies
- Role Storage: PostgreSQL `isAdmin` field

## Key Components

### 1. JWT Utilities (`src/lib/auth.ts`)
Provides cryptographic functions for authentication:
- `hashPassword()` - Hash passwords using bcryptjs
- `verifyPassword()` - Compare plaintext with hashed passwords
- `signJWT()` / `verifyJWT()` - Create and validate JWT tokens
- `createTokens()` - Generate access and refresh tokens
- `setAuthCookies()` / `clearAuthCookies()` - Manage httpOnly cookies
- `getCurrentUser()` - Get authenticated user from token

### 2. API Routes (`src/app/api/auth/`)
REST endpoints for authentication operations:

#### `POST /api/auth/register`
Register a new user with email and password
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "User Name"
}
```

#### `POST /api/auth/login`
Authenticate with email and password
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### `POST /api/auth/logout`
Clear authentication tokens

#### `GET /api/auth/me`
Get current authenticated user (requires valid JWT)

#### `POST /api/auth/refresh`
Refresh expired access token using refresh token

#### `POST /api/auth/forgot-password`
Initiate password reset flow
```json
{
  "email": "user@example.com"
}
```

#### `POST /api/auth/reset-password`
Complete password reset with token
```json
{
  "token": "reset-token-from-email",
  "password": "newPassword123"
}
```

### 3. Auth Context (`src/context/auth-context.tsx`)
React context for global authentication state management:

```typescript
const { user, isLoading, error, login, register, logout, refreshUser } = useAuth();
```

**Available Hooks:**
- `useAuth()` - Full auth context with all methods
- `useCurrentUser()` - Get current user object
- `useAuthLoading()` - Get loading state
- `useAuthError()` - Get error state

### 4. Auth Server Actions (`src/app/actions/auth.ts`)
Server-side functions for auth operations:
- `getCurrentUserProfile()` - Fetch full user profile
- `migrateFromFirebase()` - Migrate Firebase user to PostgreSQL
- `changePassword()` - Change user password
- `updateUserProfile()` - Update user name/email

## Database Schema Changes

### User Model
```prisma
model User {
  id                    String   @id @default(cuid())
  email                 String   @unique
  name                  String?
  password              String?  // Hashed password
  passwordSalt          String?  // Salt for hashing
  lastPasswordChange    DateTime?
  isAdmin               Boolean  @default(false)
  isLegacyFirebaseUser  Boolean  @default(false)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relations
  sessions     Session[]
  passwordResets PasswordReset[]
  // ... other relations
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model PasswordReset {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

## Migration Steps

### Step 1: Database Migration
```bash
npm run db:migrate
# or
prisma migrate dev --name add_postgres_auth
```

This creates:
- `password` field on User table
- `passwordSalt` field on User table
- `lastPasswordChange` field on User table
- `isAdmin` field on User table
- `isLegacyFirebaseUser` flag on User table
- New `Session` table
- New `PasswordReset` table

### Step 2: Set Environment Variables
```env
# Required for JWT signing
JWT_SECRET=your-very-long-random-secret-key-change-in-production

# Optional (defaults provided)
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d
NODE_ENV=production
```

### Step 3: Deploy Code Changes
All authentication pages and components have been updated:
- ✅ `src/app/login/page.tsx` - Uses new auth context
- ✅ `src/app/signup/page.tsx` - Uses new auth context
- ✅ `src/app/admin/layout.tsx` - Checks PostgreSQL `isAdmin` field
- ✅ `src/app/layout.tsx` - Uses AuthProvider instead of FirebaseClientProvider

### Step 4: Migrate Existing Users
Firebase users can migrate by:
1. Going to login page
2. Attempting to login with their email
3. Receiving error message about Firebase-only account
4. Option to create a PostgreSQL password
5. Using server action `migrateFromFirebase()` to complete migration

## Security Considerations

### Password Storage
- Passwords are hashed using bcryptjs (10 salt rounds)
- Never stored in plain text
- `password` field is nullable for Firebase-only users during migration

### JWT Tokens
- Access tokens: 7-day expiration
- Refresh tokens: 30-day expiration
- Tokens signed with `JWT_SECRET` (must be secure in production)
- Stored in httpOnly cookies (cannot be accessed by JavaScript)
- Secure flag enabled in production (HTTPS only)
- SameSite=Lax to prevent CSRF attacks

### Cookies
- httpOnly: True (prevents XSS attacks)
- Secure: True in production (HTTPS only)
- SameSite: Lax (CSRF protection)
- Path: / (accessible site-wide)

### Password Reset
- Reset tokens are cryptographically random (32 bytes)
- Tokens expire after 1 hour
- One-time use only (deleted after use)
- Email sending should be implemented in `forgot-password` route

## Testing the Implementation

### 1. Test Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### 2. Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Test Get Current User
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Cookie: accessToken=<token-from-login>"
```

### 4. Test Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: accessToken=<token-from-login>"
```

## Gradual Migration Strategy

### Phase 1: Initial Rollout (Current)
- New registrations use PostgreSQL auth
- Firebase users can continue using Firebase auth
- Admin layout checks PostgreSQL `isAdmin` field
- Both systems coexist

### Phase 2: Migration Period
- Firebase users are prompted to migrate
- Migration is voluntary with `migrateFromFirebase()` action
- Email notifications encourage migration
- No forced cutoff date

### Phase 3: Sunset Firebase
- Set deadline for migration (e.g., 3 months)
- Firebase auth endpoints remain available with deprecation warnings
- Strong encouragement to migrate before deadline

### Phase 4: Decommission Firebase
- Remove Firebase dependencies
- Archive Firebase project
- Keep historical data if needed

## Troubleshooting

### User Cannot Login - "Firebase User" Error
The user has a Firebase-only account. They need to migrate:
1. Use `migrateFromFirebase()` server action
2. Or wait for email migration prompt
3. After migration, they can use normal login

### JWT Secret Not Set
Error: "your-secret-key-change-in-production"

Solution: Set `JWT_SECRET` environment variable
```bash
export JWT_SECRET="generate-a-random-secure-string-here"
```

### Tokens Expiring Too Frequently
Check `JWT_EXPIRES_IN` environment variable:
```bash
export JWT_EXPIRES_IN=14d  # 14 days instead of 7
```

### Password Reset Not Working
Ensure `forgot-password` route sends reset email with token:
```
https://yourdomain.com/reset-password?token=<token>
```

## FAQ

**Q: Can I use both Firebase and PostgreSQL auth simultaneously?**
A: Yes, the system is designed for gradual migration. Firebase users are flagged with `isLegacyFirebaseUser=true`.

**Q: How do I promote a user to admin?**
A: Update the `isAdmin` field in the PostgreSQL User table:
```sql
UPDATE "User" SET "isAdmin" = true WHERE email = 'admin@example.com';
```

**Q: What happens if someone forgets their password?**
A: They use the `/forgot-password` endpoint to request a reset. A token is sent (via email in production), and they use `/reset-password` with that token.

**Q: Are cookies secure from XSS attacks?**
A: Yes, httpOnly cookies cannot be accessed by JavaScript, preventing XSS theft.

**Q: How do I refresh an expired token?**
A: The `AuthProvider` automatically calls `POST /api/auth/refresh` when needed.

## Next Steps

1. Deploy this code to your environment
2. Run `npm run db:migrate` to create new database tables
3. Set `JWT_SECRET` environment variable
4. Test registration and login flows
5. Monitor for issues and feedback
6. Begin Firebase user migration process
7. Set a migration deadline if desired
