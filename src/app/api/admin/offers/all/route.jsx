import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import AdminAuth from '@/lib/auth/admin-auth'

export async function GET(request) {
    let client;
    
    try {
        client = await pool.connect()
        // Verify admin authentication
        const adminToken = request.cookies.get('admin_token')?.value
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const adminUser = await AdminAuth.verifyToken(adminToken)
        if (!adminUser) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
        }

        // Get query parameters for filtering and pagination
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const search = searchParams.get('search')
        const limit = parseInt(searchParams.get('limit')) || 50
        const offset = parseInt(searchParams.get('offset')) || 0

        // Build the query with filters
        let query = `
            SELECT 
                ao.offer_id,
                ao.offer_device_setup_fee,
                ao.offer_transaction_fee_mada,
                ao.offer_transaction_fee_visa_mc,
                ao.offer_settlement_time_mada,
                ao.offer_comment,
                ao.admin_notes,
                ao.status,
                ao.submitted_at,
                ao.bank_name,
                ao.bank_contact_person,
                ao.bank_contact_email,
                u.email as bank_email,
                sa.application_id,
                pa.trade_name as application_trade_name,
                pa.cr_number as application_cr_number
            FROM application_offers ao
            JOIN users u ON ao.bank_user_id = u.user_id
            JOIN submitted_applications sa ON ao.submitted_application_id = sa.id
            JOIN pos_application pa ON sa.application_id = pa.application_id
            WHERE 1=1
        `
        
        const queryParams = []
        let paramCount = 0

        if (status && status !== 'all') {
            paramCount++
            query += ` AND ao.status = $${paramCount}`
            queryParams.push(status)
        }

        if (search) {
            paramCount++
            query += ` AND (pa.trade_name ILIKE $${paramCount} OR ao.bank_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`
            queryParams.push(`%${search}%`)
        }

        query += ` ORDER BY ao.submitted_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
        queryParams.push(limit, offset)

        const result = await client.query(query, queryParams)

        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) as total
            FROM application_offers ao
            JOIN users u ON ao.bank_user_id = u.user_id
            JOIN submitted_applications sa ON ao.submitted_application_id = sa.id
            JOIN pos_application pa ON sa.application_id = pa.application_id
            WHERE 1=1
        `
        
        const countParams = []
        paramCount = 0

        if (status && status !== 'all') {
            paramCount++
            countQuery += ` AND ao.status = $${paramCount}`
            countParams.push(status)
        }

        if (search) {
            paramCount++
            countQuery += ` AND (pa.trade_name ILIKE $${paramCount} OR ao.bank_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`
            countParams.push(`%${search}%`)
        }

        const countResult = await client.query(countQuery, countParams)
        const total = parseInt(countResult.rows[0].total)

        return NextResponse.json({
            success: true,
            offers: result.rows,
            pagination: {
                total,
                limit,
                offset,
                pages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        console.error('Error fetching all offers:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    } finally {
        if (client) {
            client.release()
        }
    }
}
