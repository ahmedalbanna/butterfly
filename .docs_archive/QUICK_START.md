# PostgreSQL Authentication - Quick Start (5 Minutes)

## For Immediate Testing

### Step 1: Configure Environment (1 min)
```bash
cp .env.example .env.local

# Edit .env.local and set:
# DATABASE_URL=postgresql://user:password@localhost:5432/butterfly_store
# JWT_SECRET=$(openssl rand -base64 32)
# EMAIL_PROVIDER=console
```

### Step 2: Setup Database (2 min)
```bash
# Install dependencies
npm install

# Run migrations
npm run db:migrate

# Generate Prisma Client
npm run db:generate
```

### Step 3: Start Server (1 min)
```bash
npm run dev
# Server runs on http://localhost:3000
```

### Step 4: Test Authentication (1 min)

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Check Current User:**
```bash
curl http://localhost:3000/api/auth/me -b cookies.txt
```

## For Production

See `DEPLOYMENT_GUIDE.md` for complete production setup.

## What to Read

1. **First time?** → `SETUP_INSTRUCTIONS.md`
2. **Need technical details?** → `POSTGRES_AUTH_MIGRATION_GUIDE.md`
3. **Testing?** → `TESTING_GUIDE.md`
4. **Deploying?** → `DEPLOYMENT_GUIDE.md`
5. **Overview?** → `FINAL_SUMMARY.md`

## Key Files Modified/Created

**New Files (24):**
- `src/lib/auth.ts` - JWT utilities
- `src/lib/auth-middleware.ts` - Request validation
- `src/lib/rate-limit.ts` - Rate limiting
- `src/lib/email.ts` - Email service
- `src/lib/auth-errors.ts` - Error definitions
- `src/lib/session-manager.ts` - Session management
- `src/app/api/auth/*` - 7 auth endpoints
- `src/app/api/admin/users/route.ts` - User management
- `src/context/auth-context.tsx` - Auth provider
- `src/app/reset-password/page.tsx` - Reset UI
- `src/app/actions/auth.ts` - Server actions
- 5 Documentation files (.md)
- `.env.example` - Environment template

**Updated Files (3):**
- `src/app/login/page.tsx` - Uses new auth
- `src/app/signup/page.tsx` - Uses new auth
- `src/app/admin/layout.tsx` - Uses PostgreSQL roles
- `src/app/layout.tsx` - Uses AuthProvider
- `prisma/schema.prisma` - Auth schema
- `package.json` - Added dependencies

## Environment Variables

**Required:**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=<strong-random-value>
```

**Optional (with defaults):**
```env
EMAIL_PROVIDER=console
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Common Commands

```bash
npm run dev              # Start development
npm run build            # Build for production
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
npm run typecheck        # Check TypeScript
npm start                # Run production build
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Cannot find module 'bcryptjs'` | Run `npm install` |
| Database connection fails | Check `DATABASE_URL` in `.env.local` |
| JWT errors | Set `JWT_SECRET` to a strong value |
| Port 3000 already in use | Change port: `npm run dev -- -p 3001` |

## Next: Full Documentation

After testing, read:
1. `SETUP_INSTRUCTIONS.md` - Complete setup guide
2. `TESTING_GUIDE.md` - All test cases
3. `DEPLOYMENT_GUIDE.md` - Production deployment
4. `POSTGRES_AUTH_MIGRATION_GUIDE.md` - Technical details

---

**That's it!** You're now running PostgreSQL authentication. 🎉
