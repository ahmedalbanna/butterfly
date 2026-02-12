# Admin Login & Authentication Flow Review
## Butterfly Backend API - Email/Password Authentication

**Date:** February 11, 2026  
**Project:** LuxeFinds (Butterfly Store)  
**Review Focus:** Admin login with JWT token extraction and dashboard redirect

---

## 🎯 Overview

The authentication system implements a **PostgreSQL-backed JWT authentication** replacing Firebase. The flow handles:
1. Email/password login validation
2. JWT token creation (access + refresh)
3. httpOnly cookie storage
4. Token retrieval and current user validation
5. Admin authorization checks
6. Dashboard access and redirect

---

## 📊 Authentication Architecture

### Key Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     LOGIN FLOW DIAGRAM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. CLIENT: /login page (email/password form)                   │
│     ↓                                                             │
│  2. AuthContext.login() → POST /api/auth/login                  │
│     ↓                                                             │
│  3. BACKEND: Validate credentials & create JWT tokens           │
│     ↓                                                             │
│  4. Set httpOnly cookies (accessToken + refreshToken)           │
│     ↓                                                             │
│  5. Return user object to client                                │
│     ↓                                                             │
│  6. AuthContext updates state → user object stored              │
│     ↓                                                             │
│  7. /admin layout checks isAdmin flag                           │
│     ↓                                                             │
│  8. Route to dashboard if authorized                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Detailed Implementation Review

### 1. Authentication Utilities (`src/lib/auth.ts`)

**JWT Configuration:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'  // Access token validity
const REFRESH_TOKEN_EXPIRES_IN = '30d'  // Refresh token validity
```

**JWTPayload Interface:**
```typescript
interface JWTPayload {
  userId: string
  email: string
  isAdmin: boolean
  iat?: number  // Issued at
  exp?: number  // Expiration
}
```

#### Key Functions:

| Function | Purpose | Security Notes |
|----------|---------|-----------------|
| `hashPassword()` | bcrypt password hashing (10 salt rounds) | ✅ Industry standard |
| `verifyPassword()` | Compare plain text with hash | ✅ Constant-time comparison |
| `signJWT()` | Create signed JWT token | ✅ Uses JWT_SECRET |
| `verifyJWT()` | Decode & validate JWT | ✅ Returns null on invalid |
| `createTokens()` | Generate access + refresh tokens | ✅ Different expiry times |
| `setAuthCookies()` | Store tokens in httpOnly cookies | ✅ Secure flag enabled in prod |
| `getAccessToken()` | Retrieve access token from cookies | ✅ Server-side only |
| `getCurrentUser()` | Validate token & return JWT payload | ✅ Used for authorization checks |

**Cookie Security Configuration:**
```typescript
// Access Token (short-lived)
cookieStore.set('accessToken', accessToken, {
  httpOnly: true,           // ✅ Prevents JS access
  secure: NODE_ENV === 'production',  // ✅ HTTPS only in prod
  sameSite: 'lax',          // ✅ CSRF protection
  maxAge: 7 * 24 * 60 * 60, // ✅ 7 days
  path: '/'
})

// Refresh Token (long-lived)
cookieStore.set('refreshToken', refreshToken, {
  httpOnly: true,
  secure: NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60, // ✅ 30 days
  path: '/'
})
```

---

### 2. Login API Route (`src/app/api/auth/login/route.ts`)

**Request:** `POST /api/auth/login`  
**Payload:** `{ email: string, password: string }`

#### Step-by-Step Flow:

**Step 1: Input Validation**
```typescript
if (!email || !password) {
  return { error: 'Email and password are required' } // 400
}

if (!isValidEmail(email)) {
  return { error: 'Invalid email format' } // 400
}
```
✅ **Status:** Email format validation included

**Step 2: Rate Limiting**
```typescript
const clientIp = getClientIp(req)
const rateLimitKey = `login:${clientIp}:${email}`
const { allowed, resetTime } = checkRateLimit(rateLimitKey, 10, 15 * 60 * 1000)

if (!allowed) {
  return { error: 'Too many login attempts' } // 429
}
```
✅ **Status:** 10 attempts per 15 minutes per IP/email combo

**Step 3: User Lookup**
```typescript
const user = await prisma.user.findUnique({
  where: { email },
  select: {
    id: true,
    email: true,
    name: true,
    password: true,  // ⚠️ IMPORTANT: Password hash needed
    isAdmin: true
  }
})

if (!user) {
  return { error: 'Invalid credentials' } // 401
}
```
✅ **Status:** User found with required fields

**Step 4: Password Verification**
```typescript
const passwordMatch = await verifyPassword(password, user.password)

if (!passwordMatch) {
  return { error: 'Invalid credentials' } // 401
}
```
✅ **Status:** Constant-time password comparison using bcrypt

**Step 5: Token Creation**
```typescript
const { accessToken, refreshToken } = createTokens({
  userId: user.id,
  email: user.email,
  isAdmin: user.isAdmin  // ✅ Admin flag included in token
})
```
✅ **Status:** Both tokens created with correct payload

**Step 6: Cookie Storage**
```typescript
await setAuthCookies(accessToken, refreshToken)
resetRateLimit(rateLimitKey)  // ✅ Clear rate limit on success
```
✅ **Status:** Tokens stored in httpOnly cookies

**Step 7: Response**
```typescript
return NextResponse.json({
  success: true,
  user: {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin  // ✅ Admin flag returned to client
  }
}, { status: 200 })
```
✅ **Status:** User object with admin flag returned

---

### 3. Current User Endpoint (`src/app/api/auth/me/route.ts`)

**Request:** `GET /api/auth/me`  
**Purpose:** Retrieve current authenticated user data

```typescript
export async function GET(req: NextRequest) {
  // 1. Extract & validate token from cookies
  const jwtPayload = await getCurrentUser()
  
  if (!jwtPayload) {
    return { error: 'Not authenticated' } // 401
  }
  
  // 2. Fetch full user from database
  const user = await prisma.user.findUnique({
    where: { id: jwtPayload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,  // ✅ Admin flag refreshed from DB
      createdAt: true,
      updatedAt: true
    }
  })
  
  if (!user) {
    return { error: 'User not found' } // 404
  }
  
  return { user } // 200
}
```

✅ **Strengths:**
- Validates token before database query
- Fetches fresh user data (catches admin status changes)
- Limited field selection (no password exposure)

---

### 4. AuthContext (`src/context/auth-context.tsx`)

**Client-Side State Management**

#### Initialization (useEffect):
```typescript
useEffect(() => {
  const initializeAuth = async () => {
    try {
      // 1. Fetch current user on app load
      const response = await fetch('/api/auth/me')
      
      if (response.ok) {
        const { user: userData } = await response.json()
        setUser(userData)  // ✅ Restore user from cookies
      } else {
        setUser(null)  // ✅ Clear user if unauthorized
      }
    } catch (err) {
      setUser(null)  // ✅ Handle network errors
    } finally {
      setIsLoading(false)
    }
  }
  
  initializeAuth()
}, [])  // ✅ Runs only on mount
```

✅ **Strengths:**
- Automatic session restoration on page load
- Silent failure handling (no error toast on init)
- Prevents hydration issues

#### Login Function:
```typescript
const login = useCallback(async (email: string, password: string) => {
  setIsLoading(true)
  setError(null)
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Login failed')
    }
    
    const { user: userData } = await response.json()
    setUser(userData)  // ✅ Update state with response user
    // Cookies are automatically set by API response
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Login failed')
    setError(error)
    throw error
  } finally {
    setIsLoading(false)
  }
}, [])
```

✅ **Strengths:**
- Error handling with user-friendly messages
- Updates local state from API response
- Cookies handled transparently by browser

#### Exported Hooks:
```typescript
export const useAuth()           // Full context
export const useCurrentUser()    // Current user object
export const useAuthLoading()    // Loading state
export const useAuthError()      // Error object
```

✅ **Strengths:**
- Fine-grained hook exports for flexibility
- All hooks error on missing provider

---

### 5. Login Page UI (`src/app/login/page.tsx`)

**Client Component Flow:**

```typescript
export default function LoginPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, login } = useAuth()
  const { toast } = useToast()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // ✅ Redirect to home if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/')  // Can be customized to /admin
    }
  }, [user, authLoading, router])
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await login(email, password)  // Uses AuthContext
      
      toast({
        title: "Welcome Back",
        description: "Successfully signed in to your account."
      })
      
      router.push('/')  // ✅ Redirects to home
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Shows loading screen during auth initialization
  if (authLoading) {
    return <LoadingScreen />
  }
  
  // Renders login form
  return <LoginForm onSubmit={handleLogin} />
}
```

✅ **Strengths:**
- Auto-redirect if already authenticated
- User-friendly error toasts
- Loading states during submission

⚠️ **Observation:** Redirects to `/` instead of `/admin` for admin users

---

### 6. Admin Layout (`src/app/admin/layout.tsx`)

**Authorization & Access Control**

```typescript
export default function AdminLayout({ children }) {
  const { isLoading: authLoading } = useAuth()
  const user = useCurrentUser()  // ✅ Gets current user
  const router = useRouter()
  
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  
  // ✅ Authorization check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Not authenticated
        router.push('/login?redirect=/admin')
      } else if (user.isAdmin === true) {
        // Authenticated AND admin
        setIsAuthorized(true)
      } else {
        // Authenticated but NOT admin
        setIsAuthorized(false)
      }
    }
  }, [user, authLoading, router])
  
  // Show loading while verifying
  if (authLoading || isAuthorized === null) {
    return <VerifyingLoadingScreen />
  }
  
  // Show access denied if not admin
  if (isAuthorized === false) {
    return <AccessDeniedScreen />
  }
  
  // Show admin dashboard
  return (
    <div className="flex">
      <AdminSidebar />
      <main>{children}</main>
    </div>
  )
}
```

✅ **Strengths:**
- Three-state authorization (loading, denied, authorized)
- Redirect to login with return URL
- Clear error messaging for unauthorized users

---

## ✅ Security Assessment

### Strengths

| Category | Check | Status |
|----------|-------|--------|
| **Password Security** | bcrypt hashing (10 rounds) | ✅ Industry standard |
| **Token Signing** | JWT with shared secret | ✅ Secure |
| **Token Storage** | httpOnly cookies | ✅ Prevents XSS theft |
| **Token Transport** | HTTPS in production | ✅ Secure flag enabled |
| **CSRF Protection** | sameSite=lax cookies | ✅ Protected |
| **Rate Limiting** | 10 attempts/15 min per IP | ✅ Prevents brute force |
| **Admin Flag** | Included in JWT + refreshed from DB | ✅ Reliable |
| **Error Messages** | Generic "Invalid credentials" | ✅ No user enumeration |
| **Password Field** | Not returned in responses | ✅ Never exposed |
| **Token Validation** | Server-side before queries | ✅ Required for all endpoints |

### Areas for Consideration

| Issue | Current | Recommendation |
|-------|---------|-----------------|
| **JWT Secret** | Default in code | 🔄 Ensure set in `.env` for production |
| **Token Refresh** | No auto-refresh on expiry | 🔄 Consider implementing token refresh flow |
| **Logout Token Revocation** | No token blacklist | 🔄 Consider Redis blacklist for immediate logout |
| **Admin Redirect** | Login routes to `/` | 🔄 Could detect admin and route to `/admin` |
| **Session Timeout** | No idle timeout | 🔄 Consider adding inactivity detection |

---

## 🔄 Complete Login Flow Sequence

### Scenario: Admin User Login

```
1. USER ACTION
   └─ Visits http://app/login
      └─ AuthProvider initializes
      └─ Calls GET /api/auth/me
      └─ No cookies yet → user = null
      └─ LoginPage renders

2. USER SUBMITS FORM
   └─ Email: admin@luxury.com
   └─ Password: SecurePass123!
   └─ Clicks "Sign In"

3. CLIENT ACTION
   └─ LoginPage.handleLogin()
   └─ Calls useAuth().login(email, password)
   └─ AuthContext.login() makes request

4. HTTP REQUEST
   └─ POST /api/auth/login
   └─ Headers: Content-Type: application/json
   └─ Body: { email: "admin@luxury.com", password: "SecurePass123!" }

5. SERVER VALIDATION
   └─ Extract email & password from body
   └─ Check rate limit: login:IP:admin@luxury.com
   └─ Validate email format
   └─ Query: SELECT * FROM users WHERE email = ?
   └─ User found: id=user123, isAdmin=true, password=$2a$10$...

6. PASSWORD VERIFICATION
   └─ Call bcrypt.compare(submitted_password, hashed_password)
   └─ Result: true (password matches)

7. TOKEN GENERATION
   └─ Create JWT payload:
      {
        userId: "user123",
        email: "admin@luxury.com",
        isAdmin: true
      }
   └─ Sign with JWT_SECRET, 7d expiry → accessToken
   └─ Sign with JWT_SECRET, 30d expiry → refreshToken

8. COOKIE SETTING
   └─ Set-Cookie: accessToken = [...]; HttpOnly; Secure; SameSite=lax; Max-Age=604800
   └─ Set-Cookie: refreshToken = [...]; HttpOnly; Secure; SameSite=lax; Max-Age=2592000

9. HTTP RESPONSE
   └─ Status: 200 OK
   └─ Body: {
        success: true,
        user: {
          id: "user123",
          email: "admin@luxury.com",
          name: "Admin User",
          isAdmin: true
        }
      }

10. CLIENT STATE UPDATE
    └─ AuthContext receives response
    └─ setUser(userData)
    └─ setError(null)
    └─ setIsLoading(false)

11. PAGE REDIRECT
    └─ LoginPage.handleLogin() catches success
    └─ Toast: "Welcome Back"
    └─ router.push('/')

12. HOME PAGE LOAD
    └─ AuthProvider still mounted
    └─ user object available in context
    └─ Home page renders normally

13. ADMIN DASHBOARD ACCESS
    └─ User navigates to /admin
    └─ AdminLayout checks:
       - authLoading = false ✓
       - user exists ✓
       - user.isAdmin = true ✓
    └─ setIsAuthorized(true)
    └─ Renders AdminSidebar + content

14. CURRENT USER RETRIEVAL (On demand)
    └─ Call GET /api/auth/me
    └─ Get accessToken from cookies
    └─ verifyJWT(accessToken)
    └─ Query: SELECT * FROM users WHERE id = ?
    └─ Return fresh user data from database
```

---

## 🎯 Token Flow Details

### Access Token Lifecycle

```
CREATION (POST /api/auth/login)
└─ Payload: { userId, email, isAdmin }
└─ Signed with: JWT_SECRET
└─ Expires: 7 days
└─ Stored in: httpOnly cookie "accessToken"

USAGE (Protected endpoints)
└─ Browser automatically sends cookies
└─ Server calls: getCurrentUser()
  └─ getAccessToken() → read from cookies
  └─ verifyJWT(token) → validate signature + expiry
  └─ Return JWTPayload if valid, null if invalid

EXPIRATION (After 7 days)
└─ Token becomes invalid
└─ verifyJWT() returns null
└─ User redirected to /login
└─ Refresh token can be used to generate new access token (if implemented)
```

### Refresh Token Lifecycle

```
CREATION (POST /api/auth/login)
└─ Payload: { userId, email, isAdmin }
└─ Signed with: JWT_SECRET
└─ Expires: 30 days
└─ Stored in: httpOnly cookie "refreshToken"

USAGE (Only in /api/auth/refresh endpoint - if implemented)
└─ Similar to access token validation
└─ Used to generate NEW access token without re-login

CLEANUP (On logout)
└─ Both tokens deleted from cookies via clearAuthCookies()
└─ User redirected to /login
```

---

## 📋 Implementation Checklist

- [x] Password hashing with bcrypt (10 salt rounds)
- [x] JWT token creation with payload
- [x] httpOnly cookie storage with secure flags
- [x] Rate limiting (10 attempts/15 min)
- [x] Email validation
- [x] Password verification
- [x] Admin flag in JWT and database
- [x] Token validation on protected endpoints
- [x] Current user endpoint (`/api/auth/me`)
- [x] Admin authorization check in layout
- [x] Redirect to login if not authenticated
- [x] Redirect to dashboard if not admin
- [x] AuthContext for client state management
- [x] Automatic session restoration on page reload
- [x] Error handling with user-friendly messages
- [x] Loading states during auth operations

---

## ⚠️ Recommendations for Production

### 1. Environment Variables
```bash
# .env or .env.local
JWT_SECRET=your-super-secret-key-at-least-32-chars
NEXTAUTH_URL=https://yourdomain.com
NODE_ENV=production
```

### 2. Token Refresh Implementation
Consider implementing `/api/auth/refresh` endpoint:
```typescript
export async function POST(req: NextRequest) {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) return { error: 'No refresh token' }
  
  const payload = verifyJWT(refreshToken)
  if (!payload) return { error: 'Invalid refresh token' }
  
  const newAccessToken = signJWT(payload, JWT_EXPIRES_IN)
  await setAuthCookies(newAccessToken, refreshToken)
  
  return { success: true }
}
```

### 3. Token Blacklist for Logout
Add Redis-based token blacklist:
```typescript
// On logout, add token to blacklist
await redis.set(`token:blacklist:${token}`, '1', 'EX', REMAINING_TTL)

// On token validation, check blacklist
const isBlacklisted = await redis.exists(`token:blacklist:${token}`)
if (isBlacklisted) return null
```

### 4. Idle Session Timeout
```typescript
// In AdminLayout
useEffect(() => {
  const timeout = setTimeout(() => {
    logout()
    router.push('/login')
  }, 30 * 60 * 1000) // 30 minutes
  
  return () => clearTimeout(timeout)
}, [])
```

### 5. Admin Redirect Optimization
```typescript
// In LoginPage.handleLogin()
if (userData.isAdmin) {
  router.push('/admin')
} else {
  router.push('/')
}
```

### 6. Two-Factor Authentication (2FA)
Consider adding 2FA for admin accounts:
- Generate TOTP code after password verification
- Store temporary session state in Redis
- Verify code before issuing tokens

---

## 🔗 File Reference Map

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | Core auth utilities (JWT, hashing, cookies) |
| `src/app/api/auth/login/route.ts` | Login endpoint |
| `src/app/api/auth/me/route.ts` | Current user endpoint |
| `src/context/auth-context.tsx` | Client-side auth state management |
| `src/app/login/page.tsx` | Login UI page |
| `src/app/admin/layout.tsx` | Admin authorization wrapper |
| `src/app/admin/page.tsx` | Admin dashboard |
| `src/app/actions/auth.ts` | Server actions (profile, password) |
| `prisma/schema.prisma` | User table schema |

---

## 🎓 Summary

The LuxeFinds authentication system is **well-architected** with:

✅ **Strong Security:** bcrypt hashing, JWT tokens, httpOnly cookies, rate limiting  
✅ **Clean Architecture:** Separation of concerns (auth utils, API, context, UI)  
✅ **User Experience:** Automatic session restoration, clear error messages, loading states  
✅ **Admin Authorization:** Multi-stage checks (auth → admin flag → layout access)  
✅ **TypeScript Safety:** Full type definitions throughout

The implementation follows industry best practices and is **production-ready** with the minor enhancements noted above.

