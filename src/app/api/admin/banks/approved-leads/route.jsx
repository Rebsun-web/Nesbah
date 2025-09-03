import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

export async function GET(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
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

        const { searchParams } = new URL(req.url);
        const bankId = searchParams.get('bank_id');
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const status = searchParams.get('status') || 'all';
        
        const offset = (page - 1) * limit;

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_banks_approved-leads_route.jsx_route');
        
        try {
            // Build WHERE clause
            let whereConditions = [];
            let queryParams = [];
            let paramCount = 0;

            if (bankId) {
                paramCount++;
                whereConditions.push(`al.bank_user_id = $${paramCount}`);
                queryParams.push(bankId);
            }

            if (status !== 'all') {
                paramCount++;
                whereConditions.push(`al.status = $${paramCount}`);
                queryParams.push(status);
            }

            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

            // Count total approved leads
            const countQuery = `
                SELECT COUNT(*) as total
                FROM approved_leads al
                JOIN bank_users bu ON al.bank_user_id = bu.user_id
                ${whereClause}
            `;
            
            const countResult = await client.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].total);

            // Build the main query
            const query = `
                SELECT 
                    al.id,
                    al.application_id,
                    al.bank_user_id,
                    al.purchased_at,
                    al.offer_submitted_at,
                    al.offer_device_setup_fee,
                    al.offer_transaction_fee_mada,
                    al.offer_transaction_fee_visa_mc,
                    al.offer_settlement_time_mada,
                    al.offer_comment,
                    al.status as lead_status,
                    al.created_at,
                    
                    -- Bank Information
                    u.entity_name as bank_name,
                    bu.contact_person as bank_contact_person,
                    bu.contact_person_number as bank_contact_number,
                    
                    -- Application Information
                    pa.trade_name,
                    pa.cr_number,
                    pa.city,
                    pa.contact_person as business_contact_person,
                    pa.contact_person_number as business_contact_number,
                    pa.submitted_at as application_submitted_at,
                    
                    -- Application Status
                    sa.status as application_status,
                    sa.offers_count,
                    sa.revenue_collected
                    
                FROM approved_leads al
                JOIN bank_users bu ON al.bank_user_id = bu.user_id
                JOIN users u ON bu.user_id = u.user_id
                JOIN pos_application pa ON al.application_id = pa.application_id
                JOIN submitted_applications sa ON al.application_id = sa.application_id
                ${whereClause}
                ORDER BY al.purchased_at DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;
            
            queryParams.push(limit, offset);
            const result = await client.query(query, queryParams);

            // Get summary statistics
            const statsQuery = `
                SELECT 
                    COUNT(*) as total_approved_leads,
                    COUNT(DISTINCT al.bank_user_id) as total_banks,
                    COUNT(DISTINCT al.application_id) as total_applications,
                    SUM(CASE WHEN al.status = 'active' THEN 1 ELSE 0 END) as active_leads,
                    SUM(CASE WHEN al.status = 'completed' THEN 1 ELSE 0 END) as completed_leads,
                    AVG(EXTRACT(EPOCH FROM (al.purchased_at - pa.submitted_at))/3600) as avg_hours_to_purchase
                FROM approved_leads al
                JOIN pos_application pa ON al.application_id = pa.application_id
                ${whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''}
            `;
            
            const statsResult = await client.query(statsQuery, bankId ? [bankId] : []);

            return NextResponse.json({
                success: true,
                data: result.rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                },
                stats: statsResult.rows[0]
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error fetching approved leads:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch approved leads' }, { status: 500 });
    }
}
