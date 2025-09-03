import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import AdminAuth from '@/lib/auth/admin-auth'

export async function GET(request) {
    console.log('🏦 Bank-users API called')
    console.log('🏦 Request URL:', request.url)
    console.log('🏦 Request method:', request.method)
    
    const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_users_bank-users_route.jsx_route')
    
    try {
        // Verify admin authentication
        const adminToken = request.cookies.get('admin_token')?.value
        console.log('🏦 Admin token found:', !!adminToken)
        
        if (!adminToken) {
            console.log('🏦 No admin token, returning 401')
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        // Validate admin session using session manager
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        console.log('🏦 Session validation result:', sessionValidation.valid)
        
        if (!sessionValidation.valid) {
            console.log('🏦 Invalid session, returning 401')
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        // Get admin user from session (no database query needed)
        const adminUser = sessionValidation.adminUser;
        console.log('🏦 Admin user:', adminUser?.email)

        // Fetch all bank users
        console.log('🏦 Executing database query...')
        const result = await client.query(`
            SELECT 
                u.user_id,
                u.email,
                u.entity_name,
                u.created_at,
                bu.logo_url,
                bu.contact_person,
                bu.contact_person_number,
                bu.credit_limit
            FROM users u
            LEFT JOIN bank_users bu ON u.user_id = bu.user_id
            WHERE u.user_type = 'bank_user'
            ORDER BY u.entity_name
        `)

        console.log('🏦 Database query result:', result.rows.length, 'banks found')
        console.log('🏦 First bank:', result.rows[0])
        
        // Debug: Check all users to see what's in the database
        const allUsersResult = await client.query(`
            SELECT user_id, email, user_type, entity_name
            FROM users
            WHERE user_type = 'bank_user'
            ORDER BY entity_name
        `)
        console.log('🏦 All bank users in database:', allUsersResult.rows)
        console.log('🏦 Bank users count:', allUsersResult.rows.length)

        return NextResponse.json({
            success: true,
            banks: result.rows
        })

    } catch (error) {
        console.error('🏦 Error in bank-users API:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    } finally {
        client.release()
    }
}
