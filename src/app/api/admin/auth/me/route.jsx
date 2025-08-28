import { NextResponse } from 'next/server'
import JWTUtils from '@/lib/auth/jwt-utils'

export async function GET(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        console.log('🔧 Admin /me route: Checking for admin token');
        console.log('🔧 Admin /me route: Token found:', !!adminToken);
        console.log('🔧 Admin /me route: Token value (first 50 chars):', adminToken ? adminToken.substring(0, 50) + '...' : 'null');
        
        if (!adminToken) {
            console.log('❌ Admin /me route: No admin token found');
            return NextResponse.json(
                { success: false, error: 'No admin token found' },
                { status: 401 }
            );
        }

        // Verify JWT token without database query
        console.log('🔧 Admin /me route: Verifying JWT token...');
        console.log('🔧 Admin /me route: Token to verify:', adminToken ? adminToken.substring(0, 50) + '...' : 'null');
        const jwtResult = JWTUtils.verifyToken(adminToken);
        
        console.log('🔧 Admin /me route: JWT verification result:', jwtResult);
        
        if (!jwtResult.valid) {
            console.log('❌ Admin /me route: Invalid JWT token');
            return NextResponse.json(
                { success: false, error: 'Invalid admin token' },
                { status: 401 }
            );
        }

        const decodedToken = jwtResult.payload;
        console.log('🔧 Admin /me route: Decoded token payload:', decodedToken);

        // Check if token is for admin user
        if (decodedToken.user_type !== 'admin_user') {
            console.log('❌ Admin /me route: Token is not for admin user. user_type:', decodedToken.user_type);
            return NextResponse.json(
                { success: false, error: 'Invalid token type' },
                { status: 401 }
            );
        }

        // Extract admin user data from JWT payload (no database query needed)
        const adminUser = {
            admin_id: decodedToken.admin_id,
            email: decodedToken.email,
            full_name: decodedToken.full_name || 'Admin User',
            role: decodedToken.role,
            permissions: decodedToken.permissions || [],
            is_active: true
        };

        console.log('✅ Admin /me route: JWT verification successful for:', adminUser.email);

        return NextResponse.json({
            success: true,
            adminUser
        })

    } catch (error) {
        console.error('Admin profile error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
