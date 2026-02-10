# PostgreSQL Authentication Setup Instructions

## Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- npm or yarn

## Step 1: Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. **CRITICAL**: Generate a strong JWT secret:
```bash
openssl rand -base64 32
```

3. Update `.env.local` with your configuration:
```env
# Replace with your PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/butterfly_store"

# REQUIRED: Paste your generated secret here
JWT_SECRET="your-generated-secret-from-step-2"

# Email configuration (see Email Setup section below)
EMAIL_PROVIDER="console"  # Start with console for testing
```

## Step 2: Database Setup

### Option A: Using PostgreSQL Directly

```bash
# Create database
createdb butterfly_store

# Update DATABASE_URL in .env.local with your credentials
DATABASE_URL="postgresql://user:password@localhost:5432/butterfly_store"
```

### Option B: Using Docker

```bash
docker run --name postgres-butterfly \
  -e POSTGRES_USER=butterfly_user \
  -e POSTGRES_PASSWORD=secure_password \
  -e POSTGRES_DB=butterfly_store \
  -p 5432:5432 \
  -d postgres:15
```

Update `.env.local`:
```env
DATABASE_URL="postgresql://butterfly_user:secure_password@localhost:5432/butterfly_store"
```

## Step 3: Prisma Migration

Run the database migration to create all tables:

```bash
npm run db:migrate
```

This will:
- Create the `User` table with auth fields
- Create the `Session` table for JWT tracking
- Create the `PasswordReset` table for password recovery
- Apply all existing schema migrations

**Verify the migration:**
```bash
npm run db:studio
# Opens Prisma Studio at http://localhost:5555
```

## Step 4: Install Dependencies

```bash
npm install
```

This installs the required authentication packages:
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token creation/verification
- `@types/*` - TypeScript type definitions

## Step 5: Generate Prisma Client

```bash
npm run db:generate
```

## Step 6: Start Development Server

```bash
npm run dev
```

Server starts at: `http://localhost:3000`

## Step 7: Test Authentication

### Register a New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

Expected response:
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User",
    "isAdmin": false
  }
}
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Cookie: accessToken=<token-from-login>"
```

### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: accessToken=<token-from-login>"
```

## Email Configuration

### Option 1: Development (Console Logging)

Keep `EMAIL_PROVIDER="console"` in `.env.local`

When users request password resets, the link will be printed to console:
```
[EMAIL - Development Mode]
To: user@example.com
Subject: Reset Your Butterfly Store Password
...
```

### Option 2: Resend (Recommended for Production)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Update `.env.local`:
```env
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_xxxxxxxxxxxxx"
FROM_EMAIL="noreply@butterflystore.com"
```

### Option 3: Mailjet

1. Sign up at [mailjet.com](https://www.mailjet.com)
2. Get API Key and Secret Key
3. Update `.env.local`:
```env
EMAIL_PROVIDER="mailjet"
MAILJET_API_KEY="your_api_key"
MAILJET_SECRET_KEY="your_secret_key"
FROM_EMAIL="noreply@butterflystore.com"
```

## Admin User Setup

### Create First Admin User

1. Register a normal user account via `/signup`

2. Update the user in the database:
```bash
npm run db:studio
# Open http://localhost:5555
# Find the user in the User table
# Set isAdmin = true
# Click Save
```

Or via SQL:
```sql
UPDATE "User" SET "isAdmin" = true WHERE email = 'admin@example.com';
```

3. The user can now access `/admin`

## Production Deployment

### Environment Variables
```bash
# Generate new secrets for production
export JWT_SECRET=$(openssl rand -base64 32)

# Use production database
DATABASE_URL="postgresql://prod-user:prod-password@prod-host:5432/butterfly_store"

# Set production mode
NODE_ENV="production"

# Configure email service
EMAIL_PROVIDER="resend"
RESEND_API_KEY="your_production_key"

# Set application URL
NEXT_PUBLIC_APP_URL="https://butterflystore.com"
```

### Build for Production
```bash
npm run build
npm start
```

### Database Migration
```bash
npm run db:migrate
```

### Health Checks
Test the authentication endpoints:
```bash
curl https://butterflystore.com/api/auth/me
# Should return 401 if not logged in
```

## Troubleshooting

### Issue: "Cannot find module 'bcryptjs'"
**Solution**: Run `npm install`

### Issue: "DATABASE_URL not set"
**Solution**: Ensure `.env.local` exists and contains DATABASE_URL

### Issue: "Authentication failed" on login
**Solution**: 
1. Check password is at least 8 characters
2. Ensure user exists in database
3. Check JWT_SECRET is set

### Issue: "Too many login attempts"
**Solution**: Rate limiting is active. Wait 15 minutes or restart server to clear limits.

### Issue: Password reset email not sent
**Solution**:
1. Check EMAIL_PROVIDER is set correctly
2. For console mode, check server logs
3. For Resend/Mailjet, verify API credentials
4. Check FROM_EMAIL is valid

### Issue: Admin layout shows access denied
**Solution**:
1. Ensure user's `isAdmin` field is `true` in database
2. User must be logged in with valid JWT
3. Clear browser cookies and log in again

## Security Checklist

- [ ] JWT_SECRET is set to a strong random value
- [ ] NODE_ENV is set to 'production' in production
- [ ] Database credentials are secure
- [ ] Email service credentials are stored in environment variables
- [ ] NEXT_PUBLIC_APP_URL is set to correct domain
- [ ] HTTPS is enabled in production
- [ ] Database backups are configured
- [ ] Rate limiting is active
- [ ] Password strength validation is enforced
- [ ] Admin users are only set for trusted accounts

## Next Steps

1. **Migrate existing Firebase users** - Run migration script for existing users
2. **Configure email notifications** - Set up email service for password resets
3. **Set up monitoring** - Configure error tracking (Sentry, etc.)
4. **Performance optimization** - Enable caching and CDN
5. **Security hardening** - Enable 2FA, OAuth, SSO as needed

## Support Resources

- JWT Authentication: `POSTGRES_AUTH_MIGRATION_GUIDE.md`
- Implementation Details: `IMPLEMENTATION_SUMMARY.md`
- API Documentation: See inline comments in route files
- Database Schema: `prisma/schema.prisma`

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run typecheck` | Check TypeScript types |
| `npm install` | Install dependencies |

## Common Ports

| Service | Port |
|---------|------|
| Next.js App | 3000 |
| PostgreSQL | 5432 |
| Prisma Studio | 5555 |
| Redis | 6379 |
