import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import AdminAuth from '@/lib/auth/admin-auth'

export async function GET(request) {
    const client = await pool.connectWithRetry()
    
    try {
        // Verify admin authentication
        const adminToken = request.cookies.get('admin_token')?.value
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        // Validate admin session using session manager
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        // Get admin user from session (no database query needed)
        const adminUser = sessionValidation.adminUser;

        // Fetch all bank users
        const result = await client.query(`
            SELECT 
                u.user_id,
                u.email,
                u.user_type,
                u.entity_name,
                u.created_at,
                bu.logo_url,
                bu.sama_license_number,
                bu.bank_type
            FROM users u
            LEFT JOIN bank_users bu ON u.user_id = bu.user_id
            WHERE u.user_type = 'bank_user'
            ORDER BY u.email
        `)

        return NextResponse.json({
            success: true,
            banks: result.rows
        })

    } catch (error) {
        console.error('Error fetching bank users:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    } finally {
        client.release()
    }
}
