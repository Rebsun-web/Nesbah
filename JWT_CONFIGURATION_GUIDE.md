# JWT Configuration Guide

## Overview

This guide explains how to properly configure JWT (JSON Web Tokens) authentication in the Nesbah application, including environment variables, security best practices, and production deployment.

## Environment Variables

### Required JWT Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-this-should-be-at-least-64-characters-long
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=nesbah-app
JWT_AUDIENCE=nesbah-users

# MFA Configuration
MFA_SECRET=your-super-secret-mfa-secret-at-least-32-characters-long
```

### Generating Secure Secrets

Use the provided script to generate secure secrets:

```bash
# Generate all secrets
node scripts/generate-jwt-secret.js

# Generate only JWT secret
node scripts/generate-jwt-secret.js --jwt-only

# Generate only MFA secret
node scripts/generate-jwt-secret.js --mfa-only
```

## JWT Configuration Details

### Token Structure

JWT tokens include the following claims:

```javascript
{
  "user_id": "123",           // User ID (or admin_id for admins)
  "email": "user@example.com", // User email
  "user_type": "business_user", // User type (business_user, bank_user, admin_user)
  "role": "admin",            // Role (for admin users)
  "permissions": ["read", "write"], // Permissions (for admin users)
  "iat": 1640995200,          // Issued at timestamp
  "exp": 1641024000,          // Expiration timestamp
  "iss": "nesbah-app",        // Issuer
  "aud": "nesbah-users"       // Audience
}
```

### Token Expiration

- **Access Token**: 8 hours (configurable via `JWT_EXPIRES_IN`)
- **Refresh Token**: 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`)

### Security Features

1. **Issuer Verification**: Tokens are verified against the configured issuer
2. **Audience Verification**: Tokens are verified against the configured audience
3. **Expiration Checking**: Automatic token expiration validation
4. **Secure Secret**: 64-character minimum secret requirement
5. **Token Refresh**: Automatic token refresh logic

## Implementation

### JWT Utility Class

The application uses a centralized `JWTUtils` class (`src/lib/auth/jwt-utils.js`) for all JWT operations:

```javascript
import JWTUtils from '@/lib/auth/jwt-utils';

// Generate token for regular user
const token = JWTUtils.generateUserToken(user);

// Generate token for admin user
const token = JWTUtils.generateAdminToken(adminUser);

// Verify token
const decoded = JWTUtils.verifyToken(token);

// Check if token is expired
const isExpired = JWTUtils.isTokenExpired(token);

// Check if token should be refreshed
const shouldRefresh = JWTUtils.shouldRefreshToken(token);
```

### API Authentication

All API routes use the `authenticateAPIRequest` utility:

```javascript
import { authenticateAPIRequest } from '@/lib/auth/api-auth';

export async function GET(req) {
    const authResult = await authenticateAPIRequest(req, 'business_user');
    if (!authResult.success) {
        return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
        );
    }
    
    // Proceed with authenticated request
    const user = authResult.user;
    // ... rest of the code
}
```

### Client-Side Authentication

Client-side components use the `makeAuthenticatedRequest` utility:

```javascript
import { makeAuthenticatedRequest } from '@/lib/auth/client-auth';

const response = await makeAuthenticatedRequest('/api/admin/users');
if (response) {
    const data = await response.json();
    // Handle response
}
```

## Security Best Practices

### 1. Environment Variables

- ✅ Store secrets in environment variables
- ✅ Never commit secrets to version control
- ✅ Use different secrets for development and production
- ✅ Rotate secrets periodically

### 2. Token Security

- ✅ Use HTTPS in production
- ✅ Set appropriate token expiration times
- ✅ Implement token refresh mechanism
- ✅ Validate token issuer and audience
- ✅ Store tokens securely (HTTP-only cookies for admin)

### 3. Secret Management

- ✅ Use cryptographically secure random secrets
- ✅ Minimum 64 characters for JWT secrets
- ✅ Minimum 32 characters for MFA secrets
- ✅ Use the provided generation script

### 4. Production Deployment

```bash
# Generate production secrets
node scripts/generate-jwt-secret.js

# Set environment variables in your deployment platform
JWT_SECRET=<generated-secret>
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=nesbah-app
JWT_AUDIENCE=nesbah-users
MFA_SECRET=<generated-mfa-secret>
```

## Testing JWT Configuration

Run the JWT authentication test:

```bash
node scripts/test-jwt-authentication.js
```

This will verify:
- JWT utility implementation
- API authentication updates
- Client-side authentication updates
- User types and JWT support
- Authentication methods
- Security features
- API routes with JWT authentication
- Client components with JWT

## Troubleshooting

### Common Issues

1. **"JWT_SECRET not set" warning**
   - Solution: Set `JWT_SECRET` in your `.env` file

2. **"Invalid JWT token" errors**
   - Check if the token is expired
   - Verify the secret matches between token generation and verification
   - Ensure issuer and audience match

3. **Token verification failures**
   - Check environment variables are loaded correctly
   - Verify token format and structure
   - Check for clock skew issues

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=true
LOG_LEVEL=debug
```

This will provide detailed JWT verification logs.

## Migration from Previous Authentication

If migrating from a previous authentication system:

1. Generate new JWT secrets
2. Update environment variables
3. Test authentication with new tokens
4. Monitor for any authentication failures
5. Update any hardcoded authentication logic

## Monitoring and Logging

The application logs JWT-related events:

- Token generation
- Token verification
- Token expiration
- Authentication failures
- Token refresh attempts

Monitor these logs for security issues and performance optimization.

## Compliance and Standards

The JWT implementation follows:

- RFC 7519 (JSON Web Token)
- RFC 7515 (JSON Web Signature)
- OAuth 2.0 best practices
- Security industry standards

## Support

For JWT-related issues:

1. Check the troubleshooting section
2. Review environment variable configuration
3. Test with the provided test script
4. Check application logs for detailed error messages
