import { NextResponse } from 'next/server'
import AdminAuth from '@/lib/auth/admin-auth'

export async function GET(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json(
                { success: false, error: 'No admin token found' },
                { status: 401 }
            );
        }

        // Verify admin token
        const decoded = AdminAuth.verifyToken(adminToken);
        if (!decoded) {
            return NextResponse.json(
                { success: false, error: 'Invalid admin token' },
                { status: 401 }
            );
        }

        // Get admin user from database
        const adminUser = await AdminAuth.getAdminById(decoded.admin_id);
        if (!adminUser || !adminUser.is_active) {
            return NextResponse.json(
                { success: false, error: 'Admin user not found or inactive' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            adminUser: {
                admin_id: adminUser.admin_id,
                email: adminUser.email,
                full_name: adminUser.full_name,
                role: adminUser.role,
                permissions: adminUser.permissions,
                is_active: adminUser.is_active
            }
        })

    } catch (error) {
        console.error('Admin profile error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
