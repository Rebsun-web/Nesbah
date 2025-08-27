# 🔐 Authentication Implementation - Portal Protection

## Overview

This document describes the comprehensive authentication system implemented to protect the portal, bankPortal, and adminPortal URLs from unauthorized access.

## 🛡️ Protected Routes

### **Client-Side Protection**
- **`/portal`** - Business users only (`business_user`)
- **`/bankPortal`** - Bank users only (`bank_user`) 
- **`/admin`** - Admin users only (`admin_user`)

## 🔧 Implementation Components

### **1. Client-Side Authentication Guard**
**File:** `src/components/auth/ProtectedRoute.jsx`

**Features:**
- Validates user authentication on page load
- Checks user type against required permissions
- Redirects unauthorized users to login page
- Shows loading spinner during authentication check
- Handles both regular users and admin users

**Usage:**
```jsx
<ProtectedRoute userType="business_user" redirectTo="/login">
  <PortalContent />
</ProtectedRoute>
```

### **2. Server-Side Middleware**
**File:** `middleware.js`

**Features:**
- Intercepts requests to protected routes
- Checks for authentication cookies/tokens
- Redirects unauthenticated requests to login
- Runs before page rendering for better security

**Protected Patterns:**
- `/portal/*`
- `/bankPortal/*`
- `/admin/*`

### **3. API Authentication Utility**
**File:** `src/lib/auth/api-auth.js`

**Features:**
- Validates API requests with multiple authentication methods
- Supports user tokens, Bearer tokens, and user ID headers
- Enforces user type restrictions
- Returns standardized authentication responses

**Authentication Methods:**
- `x-user-token` header (JSON stringified user data)
- `Authorization: Bearer <token>` header (admin users)
- `x-user-id` header (fallback for existing APIs)

### **4. Client-Side API Utilities**
**File:** `src/lib/auth/client-auth.js`

**Features:**
- Automatically adds authentication headers to API requests
- Handles logout on authentication failures
- Provides user management utilities
- Supports both regular and admin users

**Functions:**
- `getAuthHeaders()` - Get authentication headers
- `getCurrentUser()` - Get current authenticated user
- `isAuthenticated()` - Check if user is authenticated
- `logout()` - Clear authentication and redirect to login
- `makeAuthenticatedRequest()` - Make authenticated API calls

## 🔄 Authentication Flow

### **1. Page Access Flow**
```
User visits protected route
        ↓
Middleware checks authentication
        ↓
If not authenticated → Redirect to /login
        ↓
If authenticated → Load page with ProtectedRoute
        ↓
ProtectedRoute validates user type
        ↓
If user type matches → Render content
        ↓
If user type doesn't match → Redirect to login
```

### **2. API Request Flow**
```
Client makes API request
        ↓
makeAuthenticatedRequest() adds headers
        ↓
API route receives request
        ↓
authenticateAPIRequest() validates
        ↓
If valid → Process request
        ↓
If invalid → Return 401/403 error
        ↓
Client handles error → Redirect to login
```

## 📋 User Types and Access

### **Business Users (`business_user`)**
- **Access:** `/portal` only
- **API Access:** Business-related endpoints
- **Authentication:** User token in localStorage

### **Bank Users (`bank_user`)**
- **Access:** `/bankPortal` only
- **API Access:** Bank-related endpoints
- **Authentication:** User token in localStorage

### **Admin Users (`admin_user`)**
- **Access:** `/admin/*` routes
- **API Access:** Admin endpoints with JWT authentication
- **Authentication:** JWT tokens in localStorage + HTTP-only cookies
- **MFA Support:** Two-factor authentication
- **API Headers:** `Authorization: Bearer <jwt-token>` + `x-user-token` for admin data

## 🔒 Security Features

### **Multi-Layer Protection**
1. **Server Middleware** - First line of defense
2. **Client-Side Guards** - User experience and immediate feedback
3. **API Authentication** - Backend validation
4. **User Type Validation** - Role-based access control

### **Token Management**
- **JWT Tokens:** Secure JSON Web Tokens with expiration and verification
- **User Tokens:** JWT tokens stored in localStorage for client-side access
- **Admin Tokens:** JWT tokens in HTTP-only cookies for enhanced security
- **Token Expiration:** 8 hours for access tokens, 7 days for refresh tokens
- **Automatic Cleanup:** Tokens cleared on logout or authentication failure

### **Error Handling**
- **401 Unauthorized:** No authentication provided
- **403 Forbidden:** Authentication provided but insufficient permissions
- **Automatic Redirect:** Users redirected to login on authentication failures

## 🧪 Testing

### **Manual Testing**
1. **Without Login:**
   - Visit `/portal` → Should redirect to `/login`
   - Visit `/bankPortal` → Should redirect to `/login`
   - Visit `/admin` → Should redirect to `/login`

2. **With Wrong User Type:**
   - Login as business user → Try `/bankPortal` → Should redirect to `/login`
   - Login as bank user → Try `/portal` → Should redirect to `/login`

3. **With Correct User Type:**
   - Login as business user → `/portal` → Should work
   - Login as bank user → `/bankPortal` → Should work
   - Login as admin user → `/admin` → Should work

### **Automated Testing**
Run the test script to verify setup:
```bash
node scripts/test-auth-protection.js
```

## 📝 Implementation Status

### **✅ Completed**
- [x] Client-side ProtectedRoute component
- [x] Server-side middleware
- [x] API authentication utilities
- [x] Portal page protection
- [x] Bank portal page protection
- [x] Admin portal already protected
- [x] API route protection
- [x] Authentication headers
- [x] Error handling and redirects
- [x] JWT token implementation for all users
- [x] JWT utility class with secure token generation
- [x] Environment variable configuration
- [x] JWT secret generation script
- [x] Token expiration and refresh logic

### **🔧 Files Modified**
- `src/components/auth/ProtectedRoute.jsx` (new)
- `src/lib/auth/api-auth.js` (new)
- `src/lib/auth/client-auth.js` (new)
- `src/lib/auth/jwt-utils.js` (new)
- `middleware.js` (new)
- `src/app/portal/page.jsx` (updated)
- `src/app/bankPortal/page.jsx` (updated)
- `src/app/api/portal/client/[user_id]/route.jsx` (updated)
- `src/app/api/users/login/route.jsx` (updated)
- `src/app/api/admin/auth/login/route.jsx` (updated)
- `scripts/generate-jwt-secret.js` (new)
- `JWT_CONFIGURATION_GUIDE.md` (new)

## 🔧 Environment Variables

### **Required Environment Variables**
Create a `.env` file in your project root:

```bash
# JWT Configuration
JWT_SECRET=5f45fca69e952df8e813d8bcf8d3e5aa6e4887ee482adfb5e8d435a7d2e99966df067687881f2c21fbfdc640bd5109e99f7241a96e8326c9fb506c2dd1434abc
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=nesbah-app
JWT_AUDIENCE=nesbah-users

# MFA Configuration
MFA_SECRET=your-super-secret-mfa-secret-at-least-32-characters-long
```

### **Generating Secure Secrets**
```bash
# Generate all secrets
node scripts/generate-jwt-secret.js

# Generate only JWT secret
node scripts/generate-jwt-secret.js --jwt-only

# Generate only MFA secret
node scripts/generate-jwt-secret.js --mfa-only
```

### **Security Notes**
- ✅ Use the provided script to generate cryptographically secure secrets
- ✅ Never commit secrets to version control
- ✅ Use different secrets for development and production
- ✅ Rotate secrets periodically in production
- ✅ Minimum 64 characters for JWT secrets
- ✅ Minimum 32 characters for MFA secrets

## 🚀 Usage Examples

### **Protecting a New Page**
```jsx
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function MyProtectedPage() {
  return (
    <ProtectedRoute userType="business_user">
      <div>Protected content here</div>
    </ProtectedRoute>
  )
}
```

### **Making Authenticated API Calls**
```jsx
import { makeAuthenticatedRequest } from '@/lib/auth/client-auth'

const response = await makeAuthenticatedRequest('/api/protected-endpoint')
if (response) {
  const data = await response.json()
  // Handle data
}
```

### **Protecting API Routes**
```jsx
import { authenticateAPIRequest } from '@/lib/auth/api-auth'

export async function GET(req) {
  const authResult = await authenticateAPIRequest(req, 'business_user')
  if (!authResult.success) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status || 401 }
    )
  }
  
  // Process authenticated request
}
```

## 🎯 Summary

The authentication system now provides comprehensive protection for all portal routes and admin APIs:

1. **No unauthorized access** to portal URLs
2. **User type validation** ensures proper access control
3. **Multi-layer security** with client and server-side protection
4. **Seamless user experience** with proper error handling
5. **API protection** prevents unauthorized data access
6. **Admin API authentication** with JWT tokens and HTTP-only cookies
7. **Automatic authentication headers** for all API requests

All portals and admin APIs are now secure and require proper authentication to access!
