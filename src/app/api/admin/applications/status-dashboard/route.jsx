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

        const client = await pool.connect();
        
        try {
            // Get real-time status counts with deadline information from tracking table
            const statusCountsQuery = `
                SELECT 
                    COALESCE(aot.current_application_status, sa.status) as status,
                    COUNT(DISTINCT sa.application_id) as count,
                    COUNT(DISTINCT CASE WHEN aot.application_window_end > NOW() AND aot.current_application_status = 'pending_offers' THEN sa.application_id END) as active_auctions,
                    COUNT(DISTINCT CASE WHEN aot.offer_window_end > NOW() AND aot.current_application_status = 'offer_received' THEN sa.application_id END) as active_selections,
                    COUNT(DISTINCT CASE WHEN aot.application_window_end <= NOW() AND aot.current_application_status = 'pending_offers' THEN sa.application_id END) as expired_auctions,
                    COUNT(DISTINCT CASE WHEN aot.offer_window_end <= NOW() AND aot.current_application_status = 'offer_received' THEN sa.application_id END) as expired_selections
                FROM submitted_applications sa
                LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
                GROUP BY COALESCE(aot.current_application_status, sa.status)
                ORDER BY COALESCE(aot.current_application_status, sa.status);
            `;

            const statusCounts = await client.query(statusCountsQuery);

            // Get applications requiring immediate attention
            const urgentApplicationsQuery = `
                SELECT 
                    sa.application_id,
                    COALESCE(aot.current_application_status, sa.status) as status,
                    aot.application_window_end as auction_end_time,
                    aot.offer_window_end as offer_selection_end_time,
                    sa.offers_count,
                    sa.revenue_collected,
                    pa.submitted_at,
                    pa.trade_name,
                    EXTRACT(EPOCH FROM (aot.application_window_end - NOW()))/3600 as hours_until_auction_end,
                    EXTRACT(EPOCH FROM (aot.offer_window_end - NOW()))/3600 as hours_until_selection_end
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
                WHERE 
                    (COALESCE(aot.current_application_status, sa.status) = 'pending_offers' AND aot.application_window_end <= NOW() + INTERVAL '1 hour')
                    OR (COALESCE(aot.current_application_status, sa.status) = 'offer_received' AND aot.offer_window_end <= NOW() + INTERVAL '1 hour')
                    OR (COALESCE(aot.current_application_status, sa.status) = 'pending_offers' AND aot.application_window_end <= NOW())
                    OR (COALESCE(aot.current_application_status, sa.status) = 'offer_received' AND aot.offer_window_end <= NOW())
                ORDER BY 
                    CASE 
                        WHEN aot.application_window_end <= NOW() THEN 1
                        WHEN aot.offer_window_end <= NOW() THEN 1
                        ELSE 2
                    END,
                    aot.application_window_end ASC,
                    aot.offer_window_end ASC
                LIMIT 20;
            `;

            const urgentApplications = await client.query(urgentApplicationsQuery);

            // Get revenue analytics
            const revenueQuery = `
                SELECT 
                    (SELECT COUNT(*) * 25 FROM submitted_applications WHERE has_been_purchased = TRUE) as total_revenue,
                    (SELECT COUNT(*) FROM submitted_applications WHERE has_been_purchased = TRUE) as revenue_generating_applications,
                    25 as avg_revenue_per_application,
                    COUNT(DISTINCT CASE WHEN COALESCE(aot.current_application_status, sa.status) = 'completed' THEN sa.application_id END) as completed_applications,
                    COUNT(DISTINCT CASE WHEN COALESCE(aot.current_application_status, sa.status) = 'abandoned' THEN sa.application_id END) as abandoned_applications,
                    COUNT(DISTINCT CASE WHEN COALESCE(aot.current_application_status, sa.status) = 'deal_expired' THEN sa.application_id END) as expired_applications
                FROM submitted_applications sa
                LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id;
            `;

            const revenueAnalytics = await client.query(revenueQuery);

            // Get bank engagement metrics
            const bankEngagementQuery = `
                SELECT 
                    sa.application_id,
                    sa.status,
                    array_length(sa.ignored_by, 1) as ignored_count,
                    array_length(sa.purchased_by, 1) as purchased_count,
                    array_length(sa.opened_by, 1) as opened_count,
                    sa.offers_count,
                    pa.trade_name
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                WHERE sa.status IN ('pending_offers', 'offer_received', 'completed')
                ORDER BY pa.submitted_at DESC
                LIMIT 50;
            `;

            const bankEngagement = await client.query(bankEngagementQuery);

            return NextResponse.json({
                success: true,
                data: {
                    statusCounts: statusCounts.rows,
                    urgentApplications: urgentApplications.rows,
                    revenueAnalytics: revenueAnalytics.rows[0],
                    bankEngagement: bankEngagement.rows,
                    timestamp: new Date().toISOString()
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Admin status dashboard error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch status dashboard data' },
            { status: 500 }
        );
    }
}
