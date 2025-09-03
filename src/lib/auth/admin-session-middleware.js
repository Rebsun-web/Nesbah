import { NextResponse } from 'next/server'
import JWTUtils from './jwt-utils.js'

// Middleware to wrap admin API routes with JWT authentication
export function withAdminSession(handler) {
    return async (req) => {
        try {
            // Get authorization header
            const authHeader = req.headers.get('authorization')
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return NextResponse.json(
                    { success: false, error: 'Authorization header with Bearer token required' },
                    { status: 401 }
                )
            }

            const token = authHeader.substring(7)
            
            // Verify JWT token
            const jwtResult = JWTUtils.verifyToken(token)
            
            if (!jwtResult.valid) {
                return NextResponse.json(
                    { success: false, error: jwtResult.error || 'Invalid JWT token' },
                    { status: 401 }
                )
            }

            const decoded = jwtResult.payload
            
            // Validate admin user type
            if (!decoded || decoded.user_type !== 'admin_user') {
                return NextResponse.json(
                    { success: false, error: 'Admin access required' },
                    { status: 403 }
                )
            }

            // Add admin user to request context
            req.adminUser = {
                admin_id: decoded.admin_id || decoded.user_id,
                user_id: decoded.user_id,
                email: decoded.email,
                full_name: decoded.full_name || decoded.entity_name,
                entity_name: decoded.entity_name,
                role: decoded.role,
                permissions: decoded.permissions,
                is_active: decoded.account_status === 'active'
            }
            
            // Call the original handler
            return await handler(req)
            
        } catch (error) {
            console.error('Admin session middleware error:', error)
            return NextResponse.json(
                { success: false, error: 'Internal server error' },
                { status: 500 }
            )
        }
    }
}

// Helper function to get admin user from request
export function getAdminUserFromRequest(req) {
    return req.adminUser
}

// Alternative middleware for routes that need admin auth but don't need full session validation
export function withAdminAuth(handler) {
    return async (req) => {
        try {
            // Get authorization header
            const authHeader = req.headers.get('authorization')
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return NextResponse.json(
                    { success: false, error: 'Authorization header with Bearer token required' },
                    { status: 401 }
                )
            }

            const token = authHeader.substring(7)
            
            // Verify JWT token
            const jwtResult = JWTUtils.verifyToken(token)
            
            if (!jwtResult.valid) {
                return NextResponse.json(
                    { success: false, error: jwtResult.error || 'Invalid JWT token' },
                    { status: 401 }
                )
            }

            const decoded = jwtResult.payload
            
            // Validate admin user type
            if (!decoded || decoded.user_type !== 'admin_user') {
                return NextResponse.json(
                    { success: false, error: 'Admin access required' },
                    { status: 403 }
                )
            }

            // Add admin user to request context
            req.adminUser = {
                admin_id: decoded.admin_id || decoded.user_id,
                user_id: decoded.user_id,
                email: decoded.email,
                full_name: decoded.full_name || decoded.entity_name,
                entity_name: decoded.entity_name,
                role: decoded.role,
                permissions: decoded.permissions,
                is_active: decoded.account_status === 'active'
            }
            
            // Call the original handler
            return await handler(req)
            
        } catch (error) {
            console.error('Admin auth middleware error:', error)
            return NextResponse.json(
                { success: false, error: 'Internal server error' },
                { status: 500 }
            )
        }
    }
}
