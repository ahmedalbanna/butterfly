# Quick Reference: Authorization Header Support for `/api/auth/me`

## 🚀 Quick Start

### Using Authorization Header
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Cookies (still works)
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Cookie: accessToken=YOUR_JWT_TOKEN"
```

---

## 📋 Request Formats

| Method | Format | Example |
|--------|--------|---------|
| **Header** | `Authorization: Bearer <token>` | `Authorization: Bearer eyJhbGc...` |
| **Cookie** | `accessToken=<token>` | `Cookie: accessToken=eyJhbGc...` |

---

## ✅ Success Response (200 OK)

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

---

## ❌ Error Responses

| Status | Error | Cause |
|--------|-------|-------|
| **400** | `Invalid Authorization header format` | Malformed Bearer header |
| **401** | `Not authenticated` | Missing/invalid/expired token |
| **404** | `User not found` | User deleted from database |
| **500** | `Failed to get user` | Server error |

---

## 🔑 Bearer Format Rules

✅ **Valid:**
- `Authorization: Bearer eyJhbGc...`
- `Authorization: bearer eyJhbGc...` (case-insensitive)
- `Authorization: Bearer   eyJhbGc...` (extra spaces OK)

❌ **Invalid:**
- `Authorization: eyJhbGc...` (missing "Bearer")
- `Authorization: Bearer` (missing token)
- `Authorization: Basic xyz` (wrong scheme)

---

## 🧑‍💻 Code Examples

### JavaScript
```javascript
const response = await fetch('/api/auth/me', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
const { user } = await response.json();
```

### Python
```python
import requests
headers = {'Authorization': f'Bearer {access_token}'}
response = requests.get('http://localhost:3000/api/auth/me', headers=headers)
user = response.json()['user']
```

### Postman
1. Open request to `GET /api/auth/me`
2. Go to "Authorization" tab
3. Type: **Bearer Token**
4. Token: Paste your JWT
5. Click **Send**

---

## 🔐 Security Notes

- ✅ Token blacklist checked (logout revocation works)
- ✅ JWT signature validated with JWT_SECRET
- ✅ Token expiration checked
- ✅ Both header and cookie support secure
- ✅ 100% backward compatible

---

## 📌 Priority

If both header and cookie are present:
1. **Authorization header is used first** (recommended method)
2. Cookie is ignored

---

## 🎯 When to Use Each

| Situation | Use |
|-----------|-----|
| Browser/Web App | Cookie (automatic) |
| Postman/cURL/API Testing | Authorization Header |
| Mobile App | Authorization Header |
| Microservice | Authorization Header |
| Legacy Code | Cookie (still works) |

---

## 🆘 Troubleshooting

**401 Not authenticated**
- Check token is valid and not expired
- Verify token was copied correctly
- Check if user was logged out (token blacklisted)

**400 Invalid Authorization header**
- Ensure format is: `Bearer <token>`
- Check for typos in "Bearer"
- Verify token is present after "Bearer"

**404 User not found**
- User was deleted from database
- Rare edge case - user should not have valid token

---

## 📚 Full Documentation

See: `butterfly/AUTH_HEADER_SUPPORT_SUMMARY.md`

Contains:
- Complete API specifications
- All error codes
- Testing scenarios
- Developer guides
- Use cases

---

**Last Updated:** February 11, 2026
