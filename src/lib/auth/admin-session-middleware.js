import { NextResponse } from 'next/server';
import AdminAuth from './admin-auth.js';

/**
 * Middleware for session-based admin authentication
 * This replaces the old database-based authentication for API routes
 */
export function withAdminSession(handler) {
    return async (req) => {
        try {
            // Get admin token from cookies
            const adminToken = req.cookies.get('admin_token')?.value;
            
            if (!adminToken) {
                return NextResponse.json(
                    { success: false, error: 'No admin session found' },
                    { status: 401 }
                );
            }

            // Validate session (no database query)
            const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
            
            if (!sessionValidation.valid) {
                return NextResponse.json(
                    { success: false, error: sessionValidation.error },
                    { status: 401 }
                );
            }

            // Add admin user to request context
            req.adminUser = sessionValidation.adminUser;
            req.session = sessionValidation.session;

            // Call the original handler
            return await handler(req);

        } catch (error) {
            console.error('Admin session middleware error:', error);
            return NextResponse.json(
                { success: false, error: 'Authentication failed' },
                { status: 500 }
            );
        }
    };
}

/**
 * Middleware for checking admin permissions
 */
export function withAdminPermission(requiredPermission) {
    return function(handler) {
        return withAdminSession(async (req) => {
            const adminUser = req.adminUser;
            
            // Check if admin has the required permission
            if (!AdminAuth.hasPermission(adminUser, requiredPermission)) {
                return NextResponse.json(
                    { success: false, error: 'Insufficient permissions' },
                    { status: 403 }
                );
            }

            return await handler(req);
        });
    };
}

/**
 * Middleware for super admin only
 */
export function withSuperAdmin(handler) {
    return withAdminSession(async (req) => {
        const adminUser = req.adminUser;
        
        if (adminUser.role !== 'super_admin') {
            return NextResponse.json(
                { success: false, error: 'Super admin access required' },
                { status: 403 }
            );
        }

        return await handler(req);
    });
}

/**
 * Utility function to get admin user from request
 */
export function getAdminUserFromRequest(req) {
    return req.adminUser;
}

/**
 * Utility function to get session from request
 */
export function getSessionFromRequest(req) {
    return req.session;
}
