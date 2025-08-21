# 🔐 Role-Based Access Control (RBAC) - Nesbah Admin Portal

## Overview

The Nesbah admin portal implements a comprehensive **Role-Based Access Control (RBAC)** system that provides granular permissions and access control for different types of administrative users. The system supports three distinct roles with varying levels of access and permissions.

## 🎯 Supported Roles

### **1. Super Admin (`super_admin`)**
- **Full System Access**: Complete control over all system features
- **All Permissions**: Automatically granted all permissions
- **User Management**: Can create, modify, and delete admin users
- **System Configuration**: Full access to system settings and configurations
- **Audit Access**: Complete audit trail access

### **2. Admin (`admin`)**
- **Limited Administrative Access**: Standard administrative privileges
- **Granular Permissions**: Specific permissions assigned via JSON configuration
- **Application Management**: Can manage applications and user data
- **Revenue Access**: Can view and manage revenue data
- **Restricted System Access**: Limited system configuration access

### **3. Read-Only (`read_only`)**
- **View-Only Access**: Can only view data, no modification capabilities
- **Specific View Permissions**: Limited to specific data viewing permissions
- **No Write Access**: Cannot create, update, or delete records
- **Audit Trail**: Can view audit logs but not modify them

## 🗄️ Database Implementation

### **Admin Users Table Structure**
```sql
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

### **Role Constraints**
```sql
-- Check constraint ensuring valid roles
CONSTRAINT "admin_users_role_check" 
CHECK (role::text = ANY (ARRAY['super_admin'::character varying, 
                               'admin'::character varying, 
                               'read_only'::character varying]::text[]))
```

### **Current Admin Users**
```sql
-- Super Admin (Full Access)
INSERT INTO admin_users (email, password_hash, full_name, role, permissions)
VALUES (
    'admin@nesbah.com',
    '$2b$12$i2B9Nt/sknIXyymT4KF5QeiLjwGjaRKl9TogDmPnZcaoxbtZrnAwm',
    'System Administrator',
    'super_admin',
    '{"all_permissions": true}'
);

-- Read-Only User (Limited Access)
INSERT INTO admin_users (email, password_hash, full_name, role, permissions)
VALUES (
    'readonly@nesbah.com',
    '$2b$12$i2B9Nt/sknIXyymT4KF5QeiLjwGjaRKl9TogDmPnZcaoxbtZrnAwm',
    'Read Only User',
    'read_only',
    '{"view_applications": true, "view_revenue": true}'
);
```

## 🔧 Permission System

### **Permission Structure**
Permissions are stored as JSONB in the database, allowing for flexible permission configuration:

```json
{
  "all_permissions": true,                    // Super admin override
  "view_applications": true,                  // Can view applications
  "manage_applications": true,                // Can modify applications
  "view_revenue": true,                       // Can view revenue data
  "manage_revenue": true,                     // Can modify revenue data
  "manage_users": true,                       // Can manage users
  "view_audit_logs": true,                    // Can view audit logs
  "manage_system_settings": true,             // Can modify system settings
  "create_admin_users": true,                 // Can create new admin users
  "delete_admin_users": true                  // Can delete admin users
}
```

### **Permission Checking Logic**
```javascript
// From src/lib/auth/admin-auth.js
static hasPermission(adminUser, permission) {
    if (!adminUser || !adminUser.permissions) {
        return false
    }
    
    // Super admin has all permissions
    if (adminUser.role === 'super_admin') {
        return true
    }
    
    // Check specific permission
    if (adminUser.permissions.all_permissions) {
        return true
    }
    
    return adminUser.permissions[permission] === true
}
```

## 🛡️ Frontend Implementation

### **Protected Route Component**
```javascript
// From src/components/admin/ProtectedRoute.jsx
export default function ProtectedRoute({ children, requiredPermissions = [] }) {
    const { adminUser, loading, isAuthenticated, hasPermission } = useAdminAuth()
    
    // Check permissions if required
    if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(permission => 
            hasPermission(permission)
        )

        if (!hasAllPermissions) {
            return <AccessDeniedComponent />
        }
    }

    return children
}
```

### **Usage Examples**
```javascript
// Protect a route with specific permissions
<ProtectedRoute requiredPermissions={['manage_applications']}>
    <ApplicationsManagement />
</ProtectedRoute>

// Protect a route with multiple permissions
<ProtectedRoute requiredPermissions={['view_revenue', 'manage_revenue']}>
    <RevenueManagement />
</ProtectedRoute>

// Super admin only route
<ProtectedRoute requiredPermissions={['create_admin_users']}>
    <AdminUserManagement />
</ProtectedRoute>
```

## 🔐 Authentication Context

### **AdminAuthContext Implementation**
```javascript
// From src/contexts/AdminAuthContext.jsx
const hasPermission = (permission) => {
    if (!adminUser || !adminUser.permissions) {
        return false
    }

    // Super admin has all permissions
    if (adminUser.role === 'super_admin') {
        return true
    }

    // Check specific permission
    if (adminUser.permissions.all_permissions) {
        return true
    }

    return adminUser.permissions[permission] === true
}
```

## 🧪 Testing RBAC

### **Test Different Roles**
```bash
# Test Super Admin Login
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nesbah.com","password":"admin123"}'

# Expected Response:
{
  "success": true,
  "adminUser": {
    "admin_id": 1,
    "email": "admin@nesbah.com",
    "full_name": "System Administrator",
    "role": "super_admin",
    "permissions": {"all_permissions": true}
  }
}

# Test Read-Only User Login
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"readonly@nesbah.com","password":"admin123"}'

# Expected Response:
{
  "success": true,
  "adminUser": {
    "admin_id": 6,
    "email": "readonly@nesbah.com",
    "full_name": "Read Only User",
    "role": "read_only",
    "permissions": {
      "view_applications": true,
      "view_revenue": true
    }
  }
}
```

### **Permission Testing**
```javascript
// Test permission checking
const adminUser = {
    role: 'admin',
    permissions: {
        view_applications: true,
        manage_applications: false
    }
}

console.log(hasPermission(adminUser, 'view_applications')); // true
console.log(hasPermission(adminUser, 'manage_applications')); // false
console.log(hasPermission(adminUser, 'create_admin_users')); // false

// Super admin test
const superAdmin = {
    role: 'super_admin',
    permissions: {}
}

console.log(hasPermission(superAdmin, 'any_permission')); // true
```

## 📊 Role Hierarchy

```
super_admin
├── All permissions automatically granted
├── Can create/modify/delete admin users
├── Full system access
└── Override all permission checks

admin
├── Granular permissions via JSONB
├── Can manage applications and users
├── Limited system configuration
└── Permission-based access control

read_only
├── View-only permissions
├── Cannot modify any data
├── Limited to specific viewing permissions
└── No write access to any system
```

## 🔄 API Endpoint Protection

### **Current Implementation Status**
- ✅ **Authentication**: All admin endpoints require authentication
- ✅ **Role Validation**: User roles are validated on login
- ⚠️ **Permission Checking**: Some endpoints need permission middleware
- ⚠️ **Granular Access**: Need to implement permission checks on specific endpoints

### **Recommended API Protection**
```javascript
// Example middleware for API endpoints
export async function requirePermission(permission) {
    return async (req) => {
        const adminUser = await authenticateAdmin(req);
        if (!adminUser) {
            return { success: false, error: 'Unauthorized' };
        }
        
        if (!hasPermission(adminUser, permission)) {
            return { success: false, error: 'Insufficient permissions' };
        }
        
        return { success: true, adminUser };
    }
}

// Usage in API routes
export async function POST(req) {
    const authResult = await requirePermission('manage_applications')(req);
    if (!authResult.success) {
        return NextResponse.json(authResult, { status: 401 });
    }
    
    // Proceed with protected operation
}
```

## 🚀 Future Enhancements

### **Planned Features**
1. **Permission Groups**: Predefined permission sets for common roles
2. **Dynamic Permissions**: Runtime permission modification
3. **Permission Inheritance**: Hierarchical permission structure
4. **Audit Logging**: Track permission usage and access attempts
5. **Permission UI**: Admin interface for managing permissions

### **Permission Groups Example**
```json
{
  "application_manager": {
    "view_applications": true,
    "manage_applications": true,
    "view_revenue": true,
    "manage_revenue": false
  },
  "revenue_analyst": {
    "view_applications": true,
    "manage_applications": false,
    "view_revenue": true,
    "manage_revenue": true
  },
  "system_auditor": {
    "view_applications": true,
    "view_revenue": true,
    "view_audit_logs": true,
    "manage_audit_logs": false
  }
}
```

## 🔧 Management Commands

### **Create New Admin User**
```bash
# Using the AdminAuth library
const result = await AdminAuth.createAdminUser({
    email: 'newadmin@nesbah.com',
    password: 'securepassword123',
    full_name: 'New Admin User',
    role: 'admin',
    permissions: {
        view_applications: true,
        manage_applications: true,
        view_revenue: true
    }
});
```

### **Update User Permissions**
```bash
# Update permissions for existing user
const result = await AdminAuth.updateAdminUser(adminId, {
    permissions: {
        view_applications: true,
        manage_applications: true,
        view_revenue: true,
        manage_revenue: false
    }
});
```

### **Database Queries**
```sql
-- View all admin users with their roles
SELECT admin_id, email, full_name, role, permissions 
FROM admin_users 
ORDER BY role, admin_id;

-- Find users with specific permission
SELECT admin_id, email, full_name, role 
FROM admin_users 
WHERE permissions->>'view_revenue' = 'true';

-- Count users by role
SELECT role, COUNT(*) as user_count 
FROM admin_users 
GROUP BY role;
```

## 📞 Support

For RBAC-related issues:
1. Check user roles and permissions in the database
2. Verify permission checking logic in components
3. Test authentication flow for different roles
4. Review API endpoint protection
5. Check frontend permission validation

The RBAC system provides a robust foundation for secure, role-based access control while maintaining flexibility for future enhancements.
