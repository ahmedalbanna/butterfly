# PostgreSQL Authentication - Deployment Guide

## Pre-Deployment Checklist

### Security
- [ ] JWT_SECRET is set to a strong random value
- [ ] DATABASE_URL uses secure credentials
- [ ] NODE_ENV is set to 'production'
- [ ] HTTPS is enabled for all endpoints
- [ ] Email service credentials are stored securely
- [ ] Database backups are configured
- [ ] Admin users are verified
- [ ] Rate limiting is active
- [ ] CORS is properly configured

### Testing
- [ ] Registration flow tested
- [ ] Login/logout flows tested
- [ ] Password reset flow tested
- [ ] Token refresh tested
- [ ] Admin access control verified
- [ ] Rate limiting verified
- [ ] Email sending verified
- [ ] Database migrations successful
- [ ] No TypeScript errors (`npm run typecheck`)

### Performance
- [ ] Database indexes are in place
- [ ] JWT caching configured
- [ ] Session cleanup scheduled
- [ ] Rate limiter cleanup scheduled

## Deployment Steps

### 1. Environment Setup

```bash
# Set production environment
export NODE_ENV=production

# Generate secure JWT secret
export JWT_SECRET=$(openssl rand -base64 32)

# Database configuration
export DATABASE_URL="postgresql://user:password@host:5432/butterfly_store"

# Email service (choose one)
export EMAIL_PROVIDER=resend
export RESEND_API_KEY=your_key_here
# OR
export EMAIL_PROVIDER=mailjet
export MAILJET_API_KEY=your_key_here
export MAILJET_SECRET_KEY=your_secret_key

# Application URL
export NEXT_PUBLIC_APP_URL=https://butterflystore.com
```

### 2. Database Preparation

```bash
# Run migrations
npm run db:migrate

# Seed initial data if needed
npm run db:seed

# Verify database connection
npm run db:studio  # Check at http://localhost:5555
```

### 3. Build Application

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run db:generate

# Type check
npm run typecheck

# Build application
npm run build

# Test build locally
npm start
```

### 4. Deploy to Production

#### Option A: Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard:
# - JWT_SECRET
# - DATABASE_URL
# - EMAIL_PROVIDER
# - RESEND_API_KEY (if using Resend)
# - NEXT_PUBLIC_APP_URL
```

#### Option B: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy files
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npm run db:generate

# Build application
COPY . .
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

```bash
# Build and run Docker container
docker build -t butterfly-store .
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your_secret \
  -e DATABASE_URL=your_db_url \
  -e EMAIL_PROVIDER=resend \
  -e RESEND_API_KEY=your_key \
  butterfly-store
```

#### Option C: Traditional Server (Ubuntu/Debian)

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Clone repository
git clone your-repo-url
cd butterfly-store

# 3. Install dependencies
npm install

# 4. Create .env file with production values
sudo nano .env.production.local

# 5. Build application
npm run build

# 6. Run with PM2 (process manager)
npm install -g pm2
pm2 start npm --name "butterfly-store" -- start
pm2 save
pm2 startup

# 7. Setup Nginx reverse proxy
sudo apt-get install nginx
# Configure /etc/nginx/sites-available/butterfly-store
```

**Nginx Configuration Example:**
```nginx
upstream butterfly {
    server localhost:3000;
}

server {
    listen 80;
    server_name butterflystore.com www.butterflystore.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name butterflystore.com www.butterflystore.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://butterfly;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # JWT and authentication headers
        proxy_set_header Authorization $http_authorization;
        proxy_pass_header Authorization;
    }
}
```

## Post-Deployment Verification

### 1. Health Checks

```bash
# Check application is running
curl https://butterflystore.com

# Check authentication endpoint
curl https://butterflystore.com/api/auth/me
# Should return 401 (not authenticated)

# Check database connection
curl https://butterflystore.com/api/health/db
```

### 2. Test Authentication Flow

```bash
# 1. Register
curl -X POST https://butterflystore.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'

# 2. Login
RESPONSE=$(curl -X POST https://butterflystore.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }' \
  -c cookies.txt)

# 3. Check user
curl -X GET https://butterflystore.com/api/auth/me \
  -b cookies.txt

# 4. Logout
curl -X POST https://butterflystore.com/api/auth/logout \
  -b cookies.txt
```

### 3. Monitor Logs

```bash
# View application logs
pm2 logs butterfly-store

# Or with Docker
docker logs container_id

# Or with Vercel
vercel logs --prod
```

## Monitoring & Maintenance

### 1. Set Up Monitoring

```bash
# Install monitoring tools
npm install sentry

# Configure Sentry in your app
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### 2. Database Maintenance

```bash
# Schedule daily backups
# PostgreSQL: pg_dump butterfly_store > backup_$(date +%Y%m%d).sql

# Monitor database size
psql -U user -d butterfly_store -c "SELECT pg_size_pretty(pg_database_size('butterfly_store'));"

# Clean up old sessions periodically
npm run cleanup:sessions  # You'll need to create this script
```

### 3. SSL/TLS Certificates

```bash
# Using Let's Encrypt (free)
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d butterflystore.com -d www.butterflystore.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## Troubleshooting Production Issues

### Issue: 500 Errors on Authentication

**Check logs:**
```bash
pm2 logs butterfly-store
# or
docker logs container_id
```

**Common causes:**
- JWT_SECRET not set or wrong
- Database connection failing
- Missing Prisma Client

**Fix:**
```bash
# Verify environment variables
echo $JWT_SECRET
echo $DATABASE_URL

# Regenerate Prisma Client
npm run db:generate

# Restart application
pm2 restart butterfly-store
```

### Issue: Rate Limiting Too Aggressive

**Solution:** Adjust rate limit values in auth middleware

```typescript
// In src/app/api/auth/login/route.ts
const { allowed, resetTime } = checkRateLimit(
  rateLimitKey,
  20,  // Increase from 10 to 20
  30 * 60 * 1000  // Increase window to 30 minutes
);
```

### Issue: Emails Not Being Sent

**Check configuration:**
```bash
echo $EMAIL_PROVIDER
echo $RESEND_API_KEY  # or MAILJET credentials

# Test email service manually
curl -X POST https://butterflystore.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

### Issue: Database Connection Timeout

**Solution:**
```bash
# Verify connection string
psql $DATABASE_URL -c "SELECT 1"

# Check firewall rules for PostgreSQL port 5432
# Verify credentials in connection string

# If using managed database (AWS RDS, etc.):
# - Check security group allows inbound port 5432
# - Verify database is not in maintenance mode
```

## Scaling Considerations

### 1. Database Optimization

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_session_expires_at ON "Session"("expiresAt");
CREATE INDEX idx_password_reset_expires_at ON "PasswordReset"("expiresAt");
```

### 2. Caching Strategy

```typescript
// Cache user profiles in Redis
import { redis } from '@/lib/redis';

export async function getCachedUser(userId: string) {
  const cached = await redis.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
  }
  return user;
}
```

### 3. Load Balancing

```bash
# With multiple instances behind load balancer:
# - Use sticky sessions or shared Redis for rate limiter
# - Ensure all instances share same JWT_SECRET
# - Use managed database for shared state
```

## Security Hardening

### 1. Additional Headers

```nginx
# Add security headers
add_header X-Content-Type-Options "nosniff";
add_header X-Frame-Options "DENY";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";
```

### 2. WAF Rules (Optional)

```bash
# If using AWS WAF, Cloudflare, or similar:
# - Block common attack patterns
# - Rate limit by IP
# - Geo-block suspicious regions if needed
```

### 3. 2FA Support (Future Enhancement)

```typescript
// This is a placeholder for future implementation
export async function enableTwoFA(userId: string) {
  // Generate TOTP secret
  // Store backup codes
  // Return QR code for authenticator app
}
```

## Rollback Procedure

```bash
# If deployment fails:

# 1. Revert to previous version
git revert HEAD
npm run build

# 2. Or restore from backup
git checkout previous-tag

# 3. Restart application
pm2 restart butterfly-store

# 4. Verify health
curl https://butterflystore.com/api/auth/me
```

## Disaster Recovery

### Database Backup & Restore

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/postgresql"
DB_NAME="butterfly_store"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

```bash
# Restore from backup
psql $DATABASE_URL < /backups/postgresql/backup_20240210_120000.sql
```

## Success Metrics

Monitor these KPIs:

- **Authentication Success Rate**: Target >99.9%
- **API Response Time**: Target <100ms
- **Error Rate**: Target <0.1%
- **Database Connection Pool**: Monitor utilization
- **Session Activity**: Monitor for suspicious patterns
- **Email Delivery Rate**: Target >99%

---

For questions or issues, refer to:
- `POSTGRES_AUTH_MIGRATION_GUIDE.md` - Technical details
- `SETUP_INSTRUCTIONS.md` - Development setup
- `IMPLEMENTATION_SUMMARY.md` - Architecture overview
