# PostgreSQL Authentication - Testing Guide

## Manual Testing Checklist

### 1. Registration Flow

#### Test Case: Successful Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "name": "New User"
  }'
```
**Expected:** 201 status, user object with id, email, name, isAdmin=false

#### Test Case: Invalid Email
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalidemail",
    "password": "SecurePass123!"
  }'
```
**Expected:** 400 status, "Invalid email format" error

#### Test Case: Weak Password
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "weak"
  }'
```
**Expected:** 400 status, password strength errors

#### Test Case: Duplicate Email
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!"
  }'
```
**Expected:** 409 status, "User with this email already exists"

#### Test Case: Rate Limiting
Run registration 6 times rapidly (max 5 per hour)
**Expected:** 429 status on 6th attempt, resetTime in response

### 2. Login Flow

#### Test Case: Successful Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!"
  }'
```
**Expected:** 200 status, user object, cookies set

**Verify cookies:**
```bash
cat cookies.txt | grep -E "accessToken|refreshToken"
```
**Expected:** Two httpOnly cookies present

#### Test Case: Invalid Credentials
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "WrongPassword123!"
  }'
```
**Expected:** 401 status, "Invalid credentials"

#### Test Case: Non-existent User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "SecurePass123!"
  }'
```
**Expected:** 401 status, "Invalid credentials" (don't reveal user doesn't exist)

#### Test Case: Rate Limiting
Run login 11 times rapidly (max 10 per 15 minutes)
**Expected:** 429 status on 11th attempt

### 3. Authentication Status

#### Test Case: Get Current User (Authenticated)
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt
```
**Expected:** 200 status, current user object

#### Test Case: Get Current User (Not Authenticated)
```bash
curl -X GET http://localhost:3000/api/auth/me
```
**Expected:** 401 status, "Not authenticated"

#### Test Case: Get Current User (Expired Token)
```bash
# Manually expire token or wait for expiration
curl -X GET http://localhost:3000/api/auth/me \
  -H "Cookie: accessToken=invalid_token"
```
**Expected:** 401 status, "Invalid token"

### 4. Token Refresh

#### Test Case: Successful Refresh
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -b cookies.txt
```
**Expected:** 200 status, new tokens set in cookies

#### Test Case: Refresh Without Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh
```
**Expected:** 401 status, "No refresh token"

### 5. Logout

#### Test Case: Successful Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```
**Expected:** 200 status, "Logged out successfully"

**Verify logout:**
```bash
curl -X GET http://localhost:3000/api/auth/me
```
**Expected:** 401 status (tokens cleared)

### 6. Password Reset

#### Test Case: Request Password Reset
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com"}'
```
**Expected:** 200 status, "If an account exists, a reset link has been sent"

**Check email:**
- Console mode: Check server logs for reset link
- Resend/Mailjet: Check email inbox

#### Test Case: Invalid Email Format
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "invalidemail"}'
```
**Expected:** 400 status, "Valid email is required"

#### Test Case: Rate Limiting
Run forgot-password 6 times rapidly (max 5 per 15 minutes)
**Expected:** 429 status on 6th attempt

#### Test Case: Reset Password with Token
```bash
# Extract token from email or logs
TOKEN="extracted_token_here"

curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "'$TOKEN'",
    "password": "NewSecurePass456!"
  }'
```
**Expected:** 200 status, "Password has been reset successfully"

**Verify new password works:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "NewSecurePass456!"
  }'
```
**Expected:** 200 status, successful login

#### Test Case: Invalid Token
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "invalid_token",
    "password": "NewSecurePass456!"
  }'
```
**Expected:** 400 status, "Invalid or expired reset token"

#### Test Case: Expired Token
Wait 1+ hour after requesting reset, then try to use token
**Expected:** 400 status, "Reset token has expired"

### 7. Admin Access Control

#### Test Case: Access Admin as Non-Admin
```bash
# Login as regular user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!"
  }'

# Try to access admin
curl -X GET http://localhost:3000/api/admin/users \
  -b cookies.txt
```
**Expected:** 403 status, "Admin access required"

#### Test Case: Access Admin as Admin
Make user admin in database first:
```sql
UPDATE "User" SET "isAdmin" = true WHERE email = 'admin@example.com';
```

```bash
curl -X GET http://localhost:3000/api/admin/users \
  -b cookies.txt
```
**Expected:** 200 status, list of users

#### Test Case: Access Admin Unauthenticated
```bash
curl -X GET http://localhost:3000/api/admin/users
```
**Expected:** 401 status, "Please login"

### 8. Security Tests

#### Test Case: XSS Protection
Attempt to inject script in email during registration:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "<script>alert(1)</script>@example.com",
    "password": "SecurePass123!"
  }'
```
**Expected:** 400 status, "Invalid email format"

#### Test Case: SQL Injection Protection
Attempt SQL injection in password field:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password'; DROP TABLE users; --"
  }'
```
**Expected:** 401 status, "Invalid credentials" (no database damage)

#### Test Case: CSRF Protection
Cookies should have SameSite=Lax
```bash
curl -b cookies.txt -v http://localhost:3000/api/auth/logout | grep -i sameSite
```
**Expected:** SameSite=Lax present

#### Test Case: Cookie Security
Verify httpOnly flag on access token:
```bash
curl -v http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "pass"}' 2>&1 | grep -i httponly
```
**Expected:** httpOnly flag present in Set-Cookie header

### 9. Email Service Tests

#### Test Case: Email Provider Configuration
Verify correct provider is configured:
```bash
echo $EMAIL_PROVIDER
```
**Expected:** "console", "resend", or "mailjet"

#### Test Case: Console Email (Development)
With EMAIL_PROVIDER=console:
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Check server logs for email output
npm run dev 2>&1 | grep -A 10 "EMAIL - Development"
```
**Expected:** Email template printed to console

#### Test Case: Resend Email (Production)
With EMAIL_PROVIDER=resend and valid RESEND_API_KEY:
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'

# Check email inbox
```
**Expected:** Email received with reset link

### 10. Performance Tests

#### Test Case: Response Time
```bash
# Measure login response time
time curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!"}'
```
**Expected:** <200ms response time

#### Test Case: Concurrent Users
```bash
# Simulate 10 concurrent logins
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test'$i'@example.com", "password": "SecurePass123!"}' &
done
wait
```
**Expected:** All requests succeed

#### Test Case: Database Performance
```bash
# Check query performance
npm run db:studio

# Navigate to Query tab and run:
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Session" WHERE "expiresAt" > NOW();
```
**Expected:** Queries complete in <100ms

## Automated Testing (Jest/Vitest)

Create `src/__tests__/auth.test.ts`:

```typescript
describe('Authentication', () => {
  describe('Registration', () => {
    it('should register a new user', async () => {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User',
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.user.email).toBe('test@example.com');
    });
  });

  describe('Login', () => {
    it('should login with valid credentials', async () => {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123!',
        }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.getSetCookie()).toContain('accessToken');
    });
  });
});
```

## Testing Checklist

- [ ] All 10 test categories completed
- [ ] No security vulnerabilities found
- [ ] Response times acceptable (<200ms)
- [ ] Rate limiting working correctly
- [ ] Email service configured and tested
- [ ] Admin access control verified
- [ ] Database migrations successful
- [ ] Type checking passes
- [ ] No console errors
- [ ] Cookies set with correct flags

## Monitoring in Production

```bash
# Monitor authentication errors
tail -f /var/log/butterfly-store.log | grep "Auth"

# Check login success rate
grep "login.*success" /var/log/butterfly-store.log | wc -l

# Check rate limit hits
grep "rate.*limit" /var/log/butterfly-store.log | wc -l
```

## Troubleshooting Test Failures

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Run `npm install` |
| Database connection fails | Check `DATABASE_URL` |
| Email not sent | Check `EMAIL_PROVIDER` config |
| Rate limit errors | Wait 15 minutes or restart server |
| JWT errors | Verify `JWT_SECRET` is set |
| CORS errors | Check `NEXT_PUBLIC_APP_URL` |

---

For more information, see:
- `POSTGRES_AUTH_MIGRATION_GUIDE.md` - Technical details
- `SETUP_INSTRUCTIONS.md` - Setup instructions
- `DEPLOYMENT_GUIDE.md` - Production deployment
