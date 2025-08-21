import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

// GET - Get applications available for offers (purchased or live auction)
export async function GET(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Verify admin token
        const decoded = AdminAuth.verifyToken(adminToken);
        if (!decoded) {
            return NextResponse.json({ success: false, error: 'Invalid admin token' }, { status: 401 });
        }

        // Get admin user from database
        const adminUser = await AdminAuth.getAdminById(decoded.admin_id);
        if (!adminUser || !adminUser.is_active) {
            return NextResponse.json({ success: false, error: 'Admin user not found or inactive' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';
        const statusFilter = searchParams.get('status_filter') || 'all';
        const sortBy = searchParams.get('sortBy') || 'submitted_at';
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        
        const offset = (page - 1) * limit;

        let client;
        
        try {
            client = await pool.connect();
            // Build WHERE clause for applications available for offers
            let whereClause = "WHERE sa.status IN ('pending_offers', 'purchased')";
            const queryParams = [];
            let paramCount = 0;

            // Add status filter if specified
            if (statusFilter !== 'all') {
                paramCount++;
                whereClause += ` AND sa.status = $${paramCount}`;
                queryParams.push(statusFilter);
            }

            // Add search filter
            if (search) {
                paramCount++;
                whereClause += ` AND (pa.trade_name ILIKE $${paramCount} OR pa.cr_number ILIKE $${paramCount} OR pa.city ILIKE $${paramCount})`;
                queryParams.push(`%${search}%`);
            }

            // Build the main query
            const query = `
                SELECT 
                    sa.id,
                    sa.application_id,
                    sa.application_type,
                    sa.business_user_id,
                    sa.assigned_user_id,
                    sa.status,
                    sa.revenue_collected,
                    sa.offers_count,
                    sa.admin_notes,
                    sa.priority_level,
                    sa.submitted_at,
                    sa.auction_end_time,
                    sa.offer_selection_end_time,
                    pa.trade_name,
                    pa.cr_number,
                    pa.cr_national_number,
                    pa.legal_form,
                    pa.registration_status,
                    pa.issue_date,
                    pa.city,
                    pa.activities,
                    pa.contact_info,
                    pa.has_ecommerce,
                    pa.store_url,
                    pa.cr_capital,
                    pa.cash_capital,
                    pa.management_structure,
                    pa.management_names,
                    pa.contact_person,
                    pa.contact_person_number,
                    pa.number_of_pos_devices,
                    pa.city_of_operation,
                    pa.own_pos_system,
                    pa.notes,
                    pa.uploaded_filename,
                    pa.uploaded_mimetype,
                    bu.trade_name as business_trade_name,
                    u.email as business_email,
                    assigned_bu.trade_name as assigned_trade_name,
                    assigned_u.email as assigned_email,
                    array_length(sa.purchased_by, 1) as purchases_count,
                    sa.purchased_by as purchased_by_banks,
                    CASE 
                        WHEN sa.status = 'pending_offers' AND sa.auction_end_time <= NOW() + INTERVAL '1 hour' THEN 'auction_ending_soon'
                        WHEN sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW() + INTERVAL '1 hour' THEN 'selection_ending_soon'
                        WHEN sa.status = 'pending_offers' AND sa.auction_end_time <= NOW() THEN 'auction_expired'
                        WHEN sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW() THEN 'selection_expired'
                        ELSE 'normal'
                    END as urgency_level
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                JOIN business_users bu ON sa.business_user_id = bu.user_id
                JOIN users u ON bu.user_id = u.user_id
                LEFT JOIN business_users assigned_bu ON sa.assigned_user_id = assigned_bu.user_id
                LEFT JOIN users assigned_u ON assigned_bu.user_id = assigned_u.user_id
                ${whereClause}
                ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;
            
            queryParams.push(limit, offset);

            const applicationsResult = await client.query(query, queryParams);

            // Get total count for pagination
            let countQuery = `
                SELECT COUNT(*) as total
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                JOIN business_users bu ON sa.business_user_id = bu.user_id
                JOIN users u ON bu.user_id = u.user_id
                LEFT JOIN business_users assigned_bu ON sa.assigned_user_id = assigned_bu.user_id
                LEFT JOIN users assigned_u ON assigned_bu.user_id = assigned_u.user_id
                ${whereClause}
            `;

            const countResult = await client.query(countQuery, queryParams.slice(0, -2)); // Remove limit and offset
            const total = parseInt(countResult.rows[0].total);

            return NextResponse.json({
                success: true,
                data: {
                    applications: applicationsResult.rows,
                    pagination: {
                        total,
                        limit,
                        offset,
                        has_more: offset + limit < total
                    }
                }
            });

        } finally {
            if (client) {
                client.release();
            }
        }

    } catch (error) {
        console.error('Admin applications available for offers error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch applications available for offers' },
            { status: 500 }
        );
    }
}
