# Authorization Header Support for `/api/auth/me`

**Date:** February 11, 2026  
**Status:** ✅ Complete & Tested  
**Build Status:** ✅ Compiled Successfully

---

## 🎯 Overview

Enhanced the `GET /api/auth/me` endpoint to accept JWT tokens via the `Authorization: Bearer <token>` header, while maintaining full backward compatibility with cookie-based authentication.

---

## ✅ Implementation Summary

### 1. New Helper Functions in `butterfly/src/lib/auth.ts`

#### `getTokenFromRequest(req: NextRequest)`
Extracts JWT token from request with flexible source detection.

**Features:**
- Checks `Authorization: Bearer <token>` header first
- Falls back to `accessToken` cookie if header missing
- Validates Bearer format (case-insensitive)
- Returns token and optional error message

**Return Type:**
```typescript
{
  token: string | null,
  error?: string  // Set if header is malformed
}
```

**Error Cases:**
- Malformed Authorization header (missing "Bearer" keyword)
- Missing token after "Bearer" keyword
- Invalid Bearer format

**Example Usage:**
```typescript
const { token, error } = await getTokenFromRequest(req);
if (error) {
  return NextResponse.json({ error }, { status: 400 });
}
```

#### `verifyUserFromRequest(req: NextRequest)`
Verifies JWT token from flexible source (header or cookie).

**Features:**
- Uses `getTokenFromRequest()` to extract token
- Checks token blacklist (logout revocation)
- Validates JWT signature
- Returns JWT payload or null

**Return Type:**
```typescript
JWTPayload | null
```

**Example Usage:**
```typescript
const jwtPayload = await verifyUserFromRequest(req);
if (!jwtPayload) {
  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
}
```

---

### 2. Updated `/api/auth/me` Endpoint

**File:** `butterfly/src/app/api/auth/me/route.ts`

**Changes:**
- Replaced `getCurrentUser()` with flexible token extraction
- Added Bearer format validation
- Returns appropriate HTTP status codes

**New Error Handling:**
- `400 Bad Request` - Malformed Authorization header
- `401 Unauthorized` - Invalid/missing/expired/blacklisted token
- `404 Not Found` - User not found in database
- `500 Server Error` - Unexpected server error

---

## 📋 API Specifications

### GET /api/auth/me

#### Option 1: Authorization Header (NEW)

```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "User Name",
    "isAdmin": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-02-11T03:51:20Z"
  }
}
```

#### Option 2: Cookie (EXISTING - Still Works)

```http
GET /api/auth/me
Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "User Name",
    "isAdmin": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-02-11T03:51:20Z"
  }
}
```

#### Error Responses

**400 Bad Request - Malformed Header:**
```json
{
  "error": "Invalid Authorization header format. Use: \"Bearer <token>\""
}
```

or

```json
{
  "error": "Authorization header is missing token after \"Bearer\""
}
```

**401 Unauthorized - Missing/Invalid Token:**
```json
{
  "error": "Not authenticated"
}
```

**404 Not Found - User Deleted:**
```json
{
  "error": "User not found"
}
```

**500 Server Error:**
```json
{
  "error": "Failed to get user"
}
```

---

## 🔄 Token Extraction Priority

When the endpoint receives a request:

```
┌─────────────────────────────────┐
│ Request to GET /api/auth/me     │
└──────────────┬──────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
   Authorization   Cookies
   Header Check    Check
   (Bearer)        
        │             │
        │             │
   ┌────▼─────┐  ┌────▼─────┐
   │ Found?   │  │ Found?    │
   └────┬─────┘  └────┬─────┘
      YES│           YES│
        │             │
        ▼             ▼
    ┌─────────┐   ┌──────────┐
    │Use      │   │ Use      │
    │Header   │   │ Cookie   │
    │Token    │   │ Token    │
    └────┬────┘   └────┬─────┘
         │             │
         └──────┬──────┘
                │
                ▼
        ┌───────────────────┐
        │ Validate Token:   │
        │ - Check blacklist │
        │ - Verify JWT sig  │
        │ - Check expiry    │
        └────────┬──────────┘
                 │
           ┌─────┴─────┐
           │           │
        Valid       Invalid
           │           │
           ▼           ▼
        Fetch      Return 401
        User Data  "Not authenticated"
```

---

## 🧪 Testing Scenarios

### Test 1: GET with Authorization Header ✅

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Expected:** 200 with user object

### Test 2: GET with Cookie ✅

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Expected:** 200 with user object (backward compatibility)

### Test 3: Both Header and Cookie (Header Priority) ✅

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <header_token>" \
  -H "Cookie: accessToken=<cookie_token>"
```

**Expected:** 200 using header_token (header takes priority)

### Test 4: Malformed Header - Missing Bearer ❌

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: InvalidFormat token123"
```

**Expected:** 400 with error: "Invalid Authorization header format"

### Test 5: Malformed Header - Empty Token ❌

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer"
```

**Expected:** 400 with error: "Authorization header is missing token after Bearer"

### Test 6: No Token (Missing Both) ❌

```bash
curl -X GET http://localhost:3000/api/auth/me
```

**Expected:** 401 with error: "Not authenticated"

### Test 7: Expired Token ❌

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <expired_token>"
```

**Expected:** 401 with error: "Not authenticated"

### Test 8: Blacklisted Token (After Logout) ❌

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <revoked_token>"
```

**Expected:** 401 with error: "Not authenticated"

---

## 🔐 Security Considerations

### Bearer Format Validation
- Case-insensitive "Bearer" keyword support
- Regex validation: `/^Bearer\s+(.+)$/i`
- Validates token is present and non-empty
- Rejects malformed headers with 400

### Token Validation
- JWT signature verified with `JWT_SECRET`
- Token expiration checked
- Blacklist (logout revocation) checked
- Invalid tokens return 401

### Priority System
- Authorization header checked first (more explicit)
- Cookie fallback only if header missing
- Prevents accidental token confusion

### Error Messages
- **400:** Returns specific format error (helps developers)
- **401:** Generic "Not authenticated" (prevents user enumeration)
- **404:** User found but deleted (rare edge case)
- **500:** Server error only on exceptions

---

## 📁 Files Modified

1. **butterfly/src/lib/auth.ts**
   - Added `NextRequest` import
   - Added `getTokenFromRequest()` function
   - Added `verifyUserFromRequest()` function

2. **butterfly/src/app/api/auth/me/route.ts**
   - Updated imports (removed `getCurrentUser`, added new functions)
   - Updated GET handler to use flexible token extraction
   - Added Bearer format validation
   - Updated error handling (400 for format errors)

---

## ✨ Use Cases

### 1. Postman / API Testing Tools
Test endpoints without browser cookie support:
```
GET /api/auth/me
Authorization: Bearer <token_from_login>
```

### 2. Mobile Apps
Send token in Authorization header instead of relying on cookies:
```typescript
fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
```

### 3. CLI Tools / Scripts
Pass token via environment variable:
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Microservices / Backend APIs
Service-to-service communication with explicit tokens:
```typescript
const response = await fetch('http://api.local/auth/me', {
  headers: {
    'Authorization': `Bearer ${serviceToken}`
  }
});
```

### 5. Legacy Cookie-Based Clients
Continue working without any changes:
```typescript
// Browser automatically sends cookies
fetch('/api/auth/me')  // Still works!
```

---

## 🚀 Backward Compatibility

✅ **100% Backward Compatible**
- Existing cookie-based clients work unchanged
- No breaking changes to API contract
- GET method remains the same
- Response format identical
- Gradual migration path for clients

**Migration Path:**
1. Old clients: Use cookies (continue working)
2. New clients: Use Authorization header
3. Transition period: Both work simultaneously
4. Future: Can deprecate one method if desired

---

## 📊 Bearer Token Format

### Valid Formats ✅
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Authorization: bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  (lowercase)
Authorization: BEARER eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  (uppercase)
Authorization: Bearer   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (extra spaces)
```

### Invalid Formats ❌
```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...         (missing "Bearer")
Authorization: Bearer                                           (missing token)
Authorization: Bearereyohbcjk...                              (no space)
Authorization: Basic base64token                              (wrong scheme)
Authorization: Token abc123                                   (wrong scheme)
```

---

## 🎓 Developer Examples

### JavaScript / Node.js

```typescript
// Using Authorization header
const response = await fetch('http://localhost:3000/api/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
if (response.ok) {
  console.log('User:', data.user);
} else {
  console.error('Error:', data.error);
}
```

### Python

```python
import requests

headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}

response = requests.get('http://localhost:3000/api/auth/me', headers=headers)
if response.status_code == 200:
    user = response.json()['user']
    print(f"User: {user['email']}")
else:
    print(f"Error: {response.json()['error']}")
```

### cURL

```bash
# With Authorization header
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json"

# With cookie (still works)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Cookie: accessToken=$ACCESS_TOKEN"
```

---

## 🔗 Related Features

- **Token Refresh:** `POST /api/auth/refresh` - Get new access token
- **Logout:** `POST /api/auth/logout` - Blacklist tokens
- **Login:** `POST /api/auth/login` - Get initial tokens
- **Token Blacklist:** Redis-based immediate revocation
- **Idle Timeout:** Auto-logout after 30 minutes inactivity

---

## ✅ Quality Checklist

- [x] Authorization header support implemented
- [x] Bearer token format validation
- [x] Backward compatibility maintained
- [x] Error handling with proper HTTP status codes
- [x] Type safety with TypeScript
- [x] Token blacklist checking
- [x] JWT signature validation
- [x] Build passes without errors
- [x] Documentation complete
- [x] Example code provided

---

## 🎉 Summary

The `/api/auth/me` endpoint now supports flexible token authentication:

✅ **Authorization Header:** `Authorization: Bearer <token>`  
✅ **Cookies:** `accessToken` (backward compatible)  
✅ **Priority:** Header takes priority over cookie  
✅ **Format Validation:** Strict Bearer format checking  
✅ **Error Responses:** Clear, actionable error messages  
✅ **Security:** Blacklist and JWT validation  
✅ **Testing:** Ready for all client types  

**Ready for Production:** Yes ✅

---

**Implementation Complete:** February 11, 2026  
**Developer:** Rovo Dev AI  
**Build Status:** ✅ Passing  
