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
            // Get application counts by status using tracking table
            const applicationStatusStats = await client.query(`
                SELECT 
                    current_application_status as status,
                    COUNT(DISTINCT application_id) as count,
                    COUNT(DISTINCT CASE WHEN application_submitted_at >= NOW() - INTERVAL '30 days' THEN application_id END) as recent_count
                FROM application_offer_tracking
                GROUP BY current_application_status
                ORDER BY count DESC
            `);

            // Get applications by city
            const cityStats = await client.query(`
                SELECT 
                    pa.city,
                    COUNT(DISTINCT aot.application_id) as total_applications,
                    COUNT(DISTINCT CASE WHEN aot.current_application_status = 'completed' THEN aot.application_id END) as completed_applications,
                    COUNT(DISTINCT CASE WHEN aot.current_application_status = 'abandoned' THEN aot.application_id END) as abandoned_applications,
                    COUNT(DISTINCT CASE WHEN aot.current_application_status = 'submitted' THEN aot.application_id END) as pending_applications,
                    ROUND(
                        CASE 
                            WHEN COUNT(DISTINCT aot.application_id) > 0 
                            THEN (COUNT(DISTINCT CASE WHEN aot.current_application_status = 'completed' THEN aot.application_id END)::DECIMAL / COUNT(DISTINCT aot.application_id)) * 100 
                            ELSE 0 
                        END, 2
                    ) as completion_rate
                FROM application_offer_tracking aot
                JOIN pos_application pa ON aot.application_id = pa.application_id
                GROUP BY pa.city
                ORDER BY total_applications DESC
                LIMIT 10
            `);

            // Get applications by business type/sector
            const sectorStats = await client.query(`
                SELECT 
                    COALESCE(bu.sector, 'Unknown') as sector,
                    COUNT(DISTINCT aot.application_id) as total_applications,
                    COUNT(DISTINCT CASE WHEN aot.current_application_status = 'completed' THEN aot.application_id END) as completed_applications,
                    COUNT(DISTINCT CASE WHEN aot.current_application_status = 'abandoned' THEN aot.application_id END) as abandoned_applications,
                    COUNT(DISTINCT CASE WHEN aot.current_application_status = 'submitted' THEN aot.application_id END) as pending_applications
                FROM application_offer_tracking aot
                JOIN pos_application pa ON aot.application_id = pa.application_id
                JOIN business_users bu ON aot.business_user_id = bu.user_id
                GROUP BY bu.sector
                ORDER BY total_applications DESC
                LIMIT 10
            `);

            // Get application submission trends (last 12 months)
            const applicationTrends = await client.query(`
                SELECT 
                    DATE_TRUNC('month', application_submitted_at) as month,
                    COUNT(DISTINCT application_id) as total_applications,
                    COUNT(DISTINCT CASE WHEN current_application_status = 'completed' THEN application_id END) as completed_applications,
                    COUNT(DISTINCT CASE WHEN current_application_status = 'abandoned' THEN application_id END) as abandoned_applications,
                    COUNT(DISTINCT CASE WHEN current_application_status = 'submitted' THEN application_id END) as pending_applications
                FROM application_offer_tracking
                WHERE application_submitted_at >= NOW() - INTERVAL '12 months'
                GROUP BY DATE_TRUNC('month', application_submitted_at)
                ORDER BY month
            `);

            // Get application processing time using tracking table
            let applicationProcessingTime;
            try {
                applicationProcessingTime = await client.query(`
                    SELECT 
                        ROUND(AVG(
                            EXTRACT(EPOCH FROM (offer_accepted_at - application_submitted_at)) / 86400
                        ), 2) as avg_processing_days,
                        ROUND(MIN(
                            EXTRACT(EPOCH FROM (offer_accepted_at - application_submitted_at)) / 86400
                        ), 2) as min_processing_days,
                        ROUND(MAX(
                            EXTRACT(EPOCH FROM (offer_accepted_at - application_submitted_at)) / 86400
                        ), 2) as max_processing_days,
                        COUNT(*) as total_completed_applications
                    FROM application_offer_tracking
                    WHERE current_application_status = 'completed'
                    AND application_submitted_at IS NOT NULL
                    AND offer_accepted_at IS NOT NULL
                `);
            } catch (error) {
                console.warn('Failed to query application_offer_tracking table:', error.message);
                applicationProcessingTime = { rows: [{}] };
            }

            // Get application auction window metrics
            let auctionTimeWindows;
            try {
                auctionTimeWindows = await client.query(`
                    SELECT 
                        ROUND(AVG(
                            EXTRACT(EPOCH FROM (application_window_end - application_window_start)) / 3600
                        ), 2) as avg_auction_window_hours,
                        ROUND(MIN(
                            EXTRACT(EPOCH FROM (application_window_end - application_window_start)) / 3600
                        ), 2) as min_auction_window_hours,
                        ROUND(MAX(
                            EXTRACT(EPOCH FROM (application_window_end - application_window_start)) / 3600
                        ), 2) as max_auction_window_hours,
                        COUNT(DISTINCT application_id) as total_auctions
                    FROM application_offer_tracking
                    WHERE application_window_start IS NOT NULL
                    AND application_window_end IS NOT NULL
                `);
            } catch (error) {
                console.warn('Failed to query auction time windows:', error.message);
                auctionTimeWindows = { rows: [{}] };
            }

            // Get purchase to offer submission time
            let purchaseToOfferTime;
            try {
                purchaseToOfferTime = await client.query(`
                    SELECT 
                        ROUND(AVG(
                            EXTRACT(EPOCH FROM (offer_sent_at - purchased_at)) / 3600
                        ), 2) as avg_purchase_to_offer_hours,
                        ROUND(MIN(
                            EXTRACT(EPOCH FROM (offer_sent_at - purchased_at)) / 3600
                        ), 2) as min_purchase_to_offer_hours,
                        ROUND(MAX(
                            EXTRACT(EPOCH FROM (offer_sent_at - purchased_at)) / 3600
                        ), 2) as max_purchase_to_offer_hours,
                        COUNT(*) as total_purchased_with_offers
                    FROM application_offer_tracking
                    WHERE purchased_at IS NOT NULL
                    AND offer_sent_at IS NOT NULL
                `);
            } catch (error) {
                console.warn('Failed to query purchase to offer time:', error.message);
                purchaseToOfferTime = { rows: [{}] };
            }

            // Get offer window metrics
            let offerWindowMetrics;
            try {
                offerWindowMetrics = await client.query(`
                    SELECT 
                        ROUND(AVG(
                            EXTRACT(EPOCH FROM (offer_window_end - offer_window_start)) / 3600
                        ), 2) as avg_offer_window_hours,
                        ROUND(MIN(
                            EXTRACT(EPOCH FROM (offer_window_end - offer_window_start)) / 3600
                        ), 2) as min_offer_window_hours,
                        ROUND(MAX(
                            EXTRACT(EPOCH FROM (offer_window_end - offer_window_start)) / 3600
                        ), 2) as max_offer_window_hours,
                        COUNT(*) as total_offer_windows
                    FROM application_offer_tracking
                    WHERE offer_window_start IS NOT NULL
                    AND offer_window_end IS NOT NULL
                `);
            } catch (error) {
                console.warn('Failed to query offer window metrics:', error.message);
                offerWindowMetrics = { rows: [{}] };
            }

            // Get recent application activity (last 7 days)
            let recentActivity;
            try {
                recentActivity = await client.query(`
                    SELECT DISTINCT
                        aot.application_id,
                        aot.current_application_status as status,
                        aot.application_submitted_at as submitted_at,
                        pa.trade_name as business_name,
                        pa.city,
                        bu.sector,
                        sa.offers_count,
                        sa.revenue_collected
                    FROM application_offer_tracking aot
                    JOIN pos_application pa ON aot.application_id = pa.application_id
                    JOIN business_users bu ON aot.business_user_id = bu.user_id
                    JOIN submitted_applications sa ON aot.application_id = sa.application_id
                    WHERE aot.application_submitted_at >= NOW() - INTERVAL '7 days'
                    ORDER BY aot.application_submitted_at DESC
                    LIMIT 20
                `);
            } catch (error) {
                console.warn('Failed to query recent activity:', error.message);
                recentActivity = { rows: [] };
            }

            // Get top performing applications (by revenue)
            let topRevenueApplications;
            try {
                topRevenueApplications = await client.query(`
                    SELECT DISTINCT
                        aot.application_id,
                        pa.trade_name as business_name,
                        pa.city,
                        sa.revenue_collected,
                        sa.offers_count,
                        aot.current_application_status as status,
                        aot.application_submitted_at as submitted_at
                    FROM application_offer_tracking aot
                    JOIN pos_application pa ON aot.application_id = pa.application_id
                    JOIN submitted_applications sa ON aot.application_id = sa.application_id
                    WHERE sa.revenue_collected > 0
                    ORDER BY sa.revenue_collected DESC
                    LIMIT 10
                `);
            } catch (error) {
                console.warn('Failed to query top revenue applications:', error.message);
                topRevenueApplications = { rows: [] };
            }

            // Get applications by assigned user
            let assignedUserStats;
            try {
                assignedUserStats = await client.query(`
                    SELECT 
                        COALESCE(assigned_bu.trade_name, 'Unassigned') as assigned_user,
                        COUNT(DISTINCT aot.application_id) as total_applications,
                        COUNT(DISTINCT CASE WHEN aot.current_application_status = 'completed' THEN aot.application_id END) as completed_applications,
                        COUNT(DISTINCT CASE WHEN aot.current_application_status = 'abandoned' THEN aot.application_id END) as abandoned_applications,
                        COUNT(DISTINCT CASE WHEN aot.current_application_status = 'submitted' THEN aot.application_id END) as pending_applications,
                        ROUND(
                            CASE 
                                WHEN COUNT(DISTINCT aot.application_id) > 0 
                                THEN (COUNT(DISTINCT CASE WHEN aot.current_application_status = 'completed' THEN aot.application_id END)::DECIMAL / COUNT(DISTINCT aot.application_id)) * 100 
                                ELSE 0 
                            END, 2
                        ) as completion_rate
                    FROM application_offer_tracking aot
                    JOIN submitted_applications sa ON aot.application_id = sa.application_id
                    LEFT JOIN business_users assigned_bu ON sa.assigned_user_id = assigned_bu.user_id
                    GROUP BY assigned_bu.trade_name
                    ORDER BY total_applications DESC
                    LIMIT 10
                `);
            } catch (error) {
                console.warn('Failed to query assigned user stats:', error.message);
                assignedUserStats = { rows: [] };
            }

            // Calculate summary statistics
            const totalApplications = applicationStatusStats.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
            const totalCompletedApplications = applicationStatusStats.rows.find(row => row.status === 'completed')?.count || 0;
            const totalAbandonedApplications = applicationStatusStats.rows.find(row => row.status === 'abandoned')?.count || 0;
            const totalPendingApplications = applicationStatusStats.rows.find(row => row.status === 'submitted')?.count || 0;
            const overallCompletionRate = totalApplications > 0 ? Math.round((totalCompletedApplications / totalApplications) * 100) : 0;

            return NextResponse.json({
                success: true,
                data: {
                    summary: {
                        total_applications: totalApplications,
                        total_completed_applications: totalCompletedApplications,
                        total_abandoned_applications: totalAbandonedApplications,
                        total_pending_applications: totalPendingApplications,
                        overall_completion_rate: overallCompletionRate,
                        recent_applications: applicationStatusStats.rows.reduce((sum, row) => sum + parseInt(row.recent_count), 0)
                    },
                    by_status: applicationStatusStats.rows,
                    by_city: cityStats.rows,
                    by_sector: sectorStats.rows,
                    trends: applicationTrends.rows,
                    processing_time: applicationProcessingTime.rows[0] || {},
                    auction_time_windows: auctionTimeWindows.rows[0] || {},
                    purchase_to_offer_time: purchaseToOfferTime.rows[0] || {},
                    offer_window_metrics: offerWindowMetrics.rows[0] || {},
                    recent_activity: recentActivity.rows,
                    top_revenue: topRevenueApplications.rows,
                    by_assigned_user: assignedUserStats.rows
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Application analytics error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch application analytics' },
            { status: 500 }
        );
    }
}
