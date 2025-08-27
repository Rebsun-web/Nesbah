import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { withAdminSession, getAdminUserFromRequest } from '@/lib/auth/admin-session-middleware';

export const GET = withAdminSession(async (req) => {
    try {
        console.log('🔧 StatusDashboard API: Request received')
        
        // Get admin user from session (no database query needed)
        const adminUser = getAdminUserFromRequest(req);
        console.log('🔧 StatusDashboard API: Admin user from session:', adminUser.email)

        const client = await pool.connectWithRetry();
        
        try {
            // Get real-time status counts with simplified status structure
            const statusCountsQuery = `
                SELECT 
                    COALESCE(aot.current_application_status, sa.status) as status,
                    COUNT(DISTINCT sa.application_id) as count,
                    COUNT(DISTINCT CASE WHEN aot.application_window_end > NOW() AND aot.current_application_status = 'live_auction' THEN sa.application_id END) as active_auctions,
                    COUNT(DISTINCT CASE WHEN aot.offer_window_end > NOW() AND aot.current_application_status = 'completed' THEN sa.application_id END) as active_selections,
                    COUNT(DISTINCT CASE WHEN aot.application_window_end <= NOW() AND aot.current_application_status = 'live_auction' THEN sa.application_id END) as expired_auctions,
                    COUNT(DISTINCT CASE WHEN aot.offer_window_end <= NOW() AND aot.current_application_status = 'completed' THEN sa.application_id END) as expired_selections
                FROM submitted_applications sa
                LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
                WHERE COALESCE(aot.current_application_status, sa.status) IN ('live_auction', 'completed', 'ignored')
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
                    (COALESCE(aot.current_application_status, sa.status) = 'live_auction' AND aot.application_window_end <= NOW() + INTERVAL '1 hour')
                    OR (COALESCE(aot.current_application_status, sa.status) = 'live_auction' AND aot.application_window_end <= NOW())
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
                WHERE sa.status IN ('live_auction', 'completed', 'ignored')
                ORDER BY pa.submitted_at DESC
                LIMIT 50;
            `;

            const bankEngagement = await client.query(bankEngagementQuery);

            // Get revenue analytics
            const revenueAnalyticsQuery = `
                SELECT 
                    COALESCE(SUM(sa.revenue_collected), 0) as total_revenue,
                    COUNT(DISTINCT CASE WHEN sa.revenue_collected > 0 THEN sa.application_id END) as revenue_generating_applications,
                    COALESCE(AVG(CASE WHEN sa.revenue_collected > 0 THEN sa.revenue_collected END), 0) as avg_revenue_per_application
                FROM submitted_applications sa
            `;

            const revenueAnalytics = await client.query(revenueAnalyticsQuery);

            return NextResponse.json({
                success: true,
                data: {
                    statusCounts: statusCounts.rows,
                    urgentApplications: urgentApplications.rows,
                    bankEngagement: bankEngagement.rows,
                    revenueAnalytics: revenueAnalytics.rows[0],
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
});
