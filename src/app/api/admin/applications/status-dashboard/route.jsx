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
            // Get real-time status counts with deadline information
            const statusCountsQuery = `
                SELECT 
                    sa.status,
                    COUNT(*) as count,
                    COUNT(CASE WHEN sa.auction_end_time > NOW() THEN 1 END) as active_auctions,
                    COUNT(CASE WHEN sa.offer_selection_end_time > NOW() THEN 1 END) as active_selections,
                    COUNT(CASE WHEN sa.auction_end_time <= NOW() AND sa.status = 'pending_offers' THEN 1 END) as expired_auctions,
                    COUNT(CASE WHEN sa.offer_selection_end_time <= NOW() AND sa.status = 'offer_received' THEN 1 END) as expired_selections
                FROM submitted_applications sa
                GROUP BY sa.status
                ORDER BY sa.status;
            `;

            const statusCounts = await client.query(statusCountsQuery);

            // Get applications requiring immediate attention
            const urgentApplicationsQuery = `
                SELECT 
                    sa.application_id,
                    sa.status,
                    sa.auction_end_time,
                    sa.offer_selection_end_time,
                    sa.offers_count,
                    sa.revenue_collected,
                    pa.submitted_at,
                    pa.trade_name,
                    EXTRACT(EPOCH FROM (sa.auction_end_time - NOW()))/3600 as hours_until_auction_end,
                    EXTRACT(EPOCH FROM (sa.offer_selection_end_time - NOW()))/3600 as hours_until_selection_end
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                WHERE 
                    (sa.status = 'pending_offers' AND sa.auction_end_time <= NOW() + INTERVAL '1 hour')
                    OR (sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW() + INTERVAL '1 hour')
                    OR (sa.status = 'pending_offers' AND sa.auction_end_time <= NOW())
                    OR (sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW())
                ORDER BY 
                    CASE 
                        WHEN sa.auction_end_time <= NOW() THEN 1
                        WHEN sa.offer_selection_end_time <= NOW() THEN 1
                        ELSE 2
                    END,
                    sa.auction_end_time ASC,
                    sa.offer_selection_end_time ASC
                LIMIT 20;
            `;

            const urgentApplications = await client.query(urgentApplicationsQuery);

            // Get revenue analytics
            const revenueQuery = `
                SELECT 
                    SUM(sa.revenue_collected) as total_revenue,
                    COUNT(CASE WHEN sa.revenue_collected > 0 THEN 1 END) as revenue_generating_applications,
                    AVG(sa.revenue_collected) as avg_revenue_per_application,
                    COUNT(CASE WHEN sa.status = 'completed' THEN 1 END) as completed_applications,
                    COUNT(CASE WHEN sa.status = 'abandoned' THEN 1 END) as abandoned_applications,
                    COUNT(CASE WHEN sa.status = 'deal_expired' THEN 1 END) as expired_applications
                FROM submitted_applications sa;
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
