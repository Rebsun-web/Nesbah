import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import AdminAuth from '@/lib/auth/admin-auth'

export async function GET(request) {
    const client = await pool.connect()
    
    try {
        // Verify admin authentication
        const adminToken = request.cookies.get('admin_token')?.value
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const adminUser = await AdminAuth.verifyToken(adminToken)
        if (!adminUser) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
        }

        // Fetch all bank users
        const result = await client.query(`
            SELECT 
                user_id,
                email,
                user_type,
                created_at
            FROM users 
            WHERE user_type = 'bank_user'
            ORDER BY email
        `)

        console.log('🔍 Bank users found:', result.rows.length)
        console.log('🔍 Bank users data:', result.rows)

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
