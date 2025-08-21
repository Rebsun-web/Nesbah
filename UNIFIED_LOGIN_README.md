# 🔐 Unified Login System - Nesbah Admin Portal

## Overview

The Nesbah system now features a **unified login system** that allows both regular users and admin users to authenticate through a single login page (`http://localhost:3000/login`) while maintaining separate authentication flows and MFA support.

## 🎯 Key Features

### **Unified Login Experience**
- **Single Login Page**: All users (business, individual, bank, admin) use the same login form
- **Smart Authentication**: System automatically detects user type and routes to appropriate authentication
- **Seamless UX**: No need to remember different login URLs

### **Admin Authentication with MFA**
- **MFA Support**: Two-factor authentication for admin users
- **Session Management**: Secure HTTP-only cookies for admin sessions
- **Permission-Based Access**: Role-based access control (super_admin, admin, read_only)

### **Security Features**
- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **HTTP-Only Cookies**: Prevents XSS attacks
- **Session Validation**: Server-side session verification

## 🚀 How It Works

### **1. Login Flow**
```
User enters credentials → System tries regular user login first
                                    ↓
                            If regular login fails → Try admin login
                                    ↓
                            If admin requires MFA → Show MFA input
                                    ↓
                            Success → Redirect to appropriate portal
```

### **2. Authentication Logic**
```javascript
// 1. Try regular user login
const userResponse = await fetch('/api/users/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

// 2. If regular login fails, try admin login
if (!userResponse.ok) {
  const adminResponse = await fetch('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  
  // 3. Handle MFA if required
  if (adminData.requiresMFA) {
    // Show MFA input field
  }
}
```

## 📁 File Structure

### **Frontend Components**
```
src/app/login/page.jsx              # Unified login page
src/components/LoginStatusModal.jsx  # Error/status modal
src/contexts/AdminAuthContext.jsx    # Admin authentication context
src/app/admin/login/page.jsx         # Redirects to main login
```

### **API Endpoints**
```
src/app/api/users/login/route.jsx           # Regular user login
src/app/api/admin/auth/login/route.jsx      # Admin login with MFA
src/app/api/admin/auth/me/route.jsx         # Admin session validation
src/app/api/admin/auth/logout/route.jsx     # Admin logout
```

### **Authentication Library**
```
src/lib/auth/admin-auth.js                  # Admin authentication logic
```

## 🔧 Configuration

### **Environment Variables**
```bash
# Required for admin authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
MFA_SECRET=your-mfa-secret-key-change-in-production

# Database connection
DATABASE_URL=postgresql://user:password@host:port/database
```

### **Database Tables**
```sql
-- Admin users table with MFA support
CREATE TABLE admin_users (
    admin_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🧪 Testing

### **Admin Login Test**
```bash
# Test admin login (MFA disabled)
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nesbah.com","password":"admin123"}'

# Expected response:
{
  "success": true,
  "message": "Login successful",
  "adminUser": {
    "admin_id": 1,
    "email": "admin@nesbah.com",
    "full_name": "System Administrator",
    "role": "super_admin",
    "permissions": {"all_permissions": true},
    "mfa_enabled": false
  }
}
```

### **MFA Test**
```bash
# Enable MFA for admin user
UPDATE admin_users SET mfa_enabled = true, mfa_secret = 'testsecret123456789' 
WHERE email = 'admin@nesbah.com';

# Test login with MFA enabled
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nesbah.com","password":"admin123"}'

# Expected response:
{
  "success": false,
  "error": "MFA token required",
  "requiresMFA": true,
  "admin_id": 1
}
```

## 🔄 User Flow Examples

### **Regular User Login**
1. User visits `http://localhost:3000/login`
2. Enters business/bank/individual user credentials
3. System authenticates via `/api/users/login`
4. Redirects to appropriate portal (`/portal`, `/bankPortal`)

### **Admin User Login (No MFA)**
1. User visits `http://localhost:3000/login`
2. Enters admin credentials
3. System tries regular login → fails
4. System tries admin login → succeeds
5. Redirects to `/admin` dashboard

### **Admin User Login (With MFA)**
1. User visits `http://localhost:3000/login`
2. Enters admin credentials
3. System shows MFA input field
4. User enters 6-digit code from authenticator app
5. System verifies MFA token
6. Redirects to `/admin` dashboard

## 🛡️ Security Considerations

### **Password Security**
- All passwords are hashed using bcrypt with 12 salt rounds
- Passwords are never stored in plain text
- Password comparison is done securely

### **Session Security**
- Admin sessions use HTTP-only cookies
- JWT tokens have 8-hour expiration
- Sessions are validated server-side

### **MFA Security**
- TOTP (Time-based One-Time Password) implementation
- 30-second time windows for token validation
- MFA secrets are stored securely in database

### **Access Control**
- Role-based permissions (super_admin, admin, read_only)
- Permission checking on both frontend and backend
- Audit logging for admin actions

## 🚀 Deployment

### **Production Setup**
1. Update environment variables with secure values
2. Change default admin password
3. Enable MFA for admin users
4. Configure SSL certificates
5. Set up proper session management

### **Security Checklist**
- [ ] Change default JWT_SECRET
- [ ] Change default MFA_SECRET
- [ ] Update admin password from default
- [ ] Enable MFA for admin users
- [ ] Configure HTTPS
- [ ] Set up audit logging
- [ ] Test all authentication flows

## 🔧 Troubleshooting

### **Common Issues**

**Admin Login Fails**
```bash
# Check admin user exists
psql $DATABASE_URL -c "SELECT * FROM admin_users WHERE email = 'admin@nesbah.com';"

# Verify password hash
node scripts/generate-admin-password.js
```

**MFA Not Working**
```bash
# Check MFA columns exist
psql $DATABASE_URL -c "\d admin_users"

# Verify MFA secret
psql $DATABASE_URL -c "SELECT mfa_enabled, mfa_secret FROM admin_users WHERE email = 'admin@nesbah.com';"
```

**Session Issues**
```bash
# Clear browser cookies
# Check localStorage for adminUser
# Verify server session endpoint
curl http://localhost:3000/api/admin/auth/me
```

## 📞 Support

For issues with the unified login system:
1. Check the troubleshooting section
2. Verify database connectivity
3. Test individual API endpoints
4. Review browser console for errors
5. Check server logs for authentication errors

The unified login system provides a seamless experience while maintaining the security and functionality of separate authentication flows for different user types.
