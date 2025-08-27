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

        const client = await pool.connectWithRetry();
        
        try {
            // OPTIMIZED: Single comprehensive query for all application analytics
            const comprehensiveQuery = `
                WITH application_stats AS (
                    SELECT 
                        current_application_status as status,
                        COUNT(DISTINCT application_id) as count
                    FROM application_offer_tracking
                    WHERE current_application_status IN ('live_auction', 'completed', 'ignored')
                    GROUP BY current_application_status
                ),
                city_stats AS (
                    SELECT 
                        pa.city,
                        COUNT(DISTINCT aot.application_id) as total_applications,
                        COUNT(DISTINCT CASE WHEN aot.current_application_status = 'completed' THEN aot.application_id END) as completed_applications,
                        COUNT(DISTINCT CASE WHEN aot.current_application_status = 'ignored' THEN aot.application_id END) as ignored_applications,
                        COUNT(DISTINCT CASE WHEN aot.current_application_status = 'live_auction' THEN aot.application_id END) as live_auction_applications
                    FROM application_offer_tracking aot
                    JOIN pos_application pa ON aot.application_id = pa.application_id
                    WHERE aot.current_application_status IN ('live_auction', 'ignored', 'completed')
                    GROUP BY pa.city
                ),
                sector_stats AS (
                    SELECT 
                        COALESCE(bu.sector, 'Unknown') as sector,
                        COUNT(DISTINCT aot.application_id) as total_applications,
                        COUNT(DISTINCT CASE WHEN aot.current_application_status = 'completed' THEN aot.application_id END) as completed_applications,
                        COUNT(DISTINCT CASE WHEN aot.current_application_status = 'ignored' THEN aot.application_id END) as ignored_applications,
                        COUNT(DISTINCT CASE WHEN aot.current_application_status = 'live_auction' THEN aot.application_id END) as live_auction_applications
                    FROM application_offer_tracking aot
                    JOIN pos_application pa ON aot.application_id = pa.application_id
                    JOIN business_users bu ON aot.business_user_id = bu.user_id
                    WHERE aot.current_application_status IN ('live_auction', 'ignored', 'completed')
                    GROUP BY bu.sector
                ),
                trends AS (
                    SELECT 
                        DATE_TRUNC('month', application_submitted_at) as month,
                        COUNT(DISTINCT application_id) as total_applications,
                        COUNT(DISTINCT CASE WHEN current_application_status = 'completed' THEN application_id END) as completed_applications,
                        COUNT(DISTINCT CASE WHEN current_application_status = 'ignored' THEN application_id END) as ignored_applications,
                        COUNT(DISTINCT CASE WHEN current_application_status = 'live_auction' THEN application_id END) as live_auction_applications
                    FROM application_offer_tracking
                    WHERE application_submitted_at >= NOW() - INTERVAL '12 months'
                    AND current_application_status IN ('live_auction', 'ignored', 'completed')
                    GROUP BY DATE_TRUNC('month', application_submitted_at)
                ),
                processing_time AS (
                    SELECT 
                        ROUND(AVG(EXTRACT(EPOCH FROM (offer_accepted_at - application_submitted_at)) / 86400), 2) as avg_processing_days,
                        ROUND(MIN(EXTRACT(EPOCH FROM (offer_accepted_at - application_submitted_at)) / 86400), 2) as min_processing_days,
                        ROUND(MAX(EXTRACT(EPOCH FROM (offer_accepted_at - application_submitted_at)) / 86400), 2) as max_processing_days,
                        COUNT(*) as total_completed_applications
                    FROM application_offer_tracking
                    WHERE current_application_status = 'completed'
                    AND application_submitted_at IS NOT NULL
                    AND offer_accepted_at IS NOT NULL
                ),
                recent_activity AS (
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
                    AND aot.current_application_status IN ('live_auction', 'ignored', 'completed')
                    ORDER BY aot.application_submitted_at DESC
                    LIMIT 20
                ),
                bank_performance AS (
                    SELECT 
                        u.entity_name as bank_name,
                        u.email as bank_email,
                        COUNT(DISTINCT ao.submitted_application_id) as total_applications,
                        COUNT(DISTINCT CASE WHEN ao.status = 'submitted' THEN ao.submitted_application_id END) as applications_with_offers,
                        ROUND(
                            CASE 
                                WHEN COUNT(DISTINCT ao.submitted_application_id) > 0 
                                THEN (COUNT(DISTINCT CASE WHEN ao.status = 'submitted' THEN ao.submitted_application_id END)::DECIMAL / COUNT(DISTINCT ao.submitted_application_id)) * 100 
                                ELSE 0 
                            END, 2
                        ) as conversion_rate
                    FROM application_offers ao
                    JOIN users u ON ao.bank_user_id = u.user_id
                    JOIN submitted_applications sa ON ao.submitted_application_id = sa.id
                    WHERE u.user_type = 'bank_user'
                    GROUP BY u.entity_name, u.email, u.user_id
                )
                SELECT 
                    'application_stats' as data_type,
                    json_agg(application_stats.*) as data
                FROM application_stats
                
                UNION ALL
                
                SELECT 
                    'city_stats' as data_type,
                    json_agg(city_stats.* ORDER BY total_applications DESC) as data
                FROM (
                    SELECT * FROM city_stats ORDER BY total_applications DESC LIMIT 10
                ) city_stats
                
                UNION ALL
                
                SELECT 
                    'sector_stats' as data_type,
                    json_agg(sector_stats.* ORDER BY total_applications DESC) as data
                FROM (
                    SELECT * FROM sector_stats ORDER BY total_applications DESC LIMIT 10
                ) sector_stats
                
                UNION ALL
                
                SELECT 
                    'trends' as data_type,
                    json_agg(trends.* ORDER BY month) as data
                FROM trends
                
                UNION ALL
                
                SELECT 
                    'processing_time' as data_type,
                    json_agg(processing_time.*) as data
                FROM processing_time
                
                UNION ALL
                
                SELECT 
                    'recent_activity' as data_type,
                    json_agg(recent_activity.*) as data
                FROM recent_activity
                
                UNION ALL
                
                SELECT 
                    'bank_performance' as data_type,
                    json_agg(bank_performance.* ORDER BY conversion_rate DESC) as data
                FROM (
                    SELECT * FROM bank_performance ORDER BY conversion_rate DESC LIMIT 10
                ) bank_performance
            `;

            const result = await client.query(comprehensiveQuery);
            
            // Parse the results
            const data = {};
            result.rows.forEach(row => {
                data[row.data_type] = row.data;
            });

            // Calculate summary statistics
            const applicationStats = data.application_stats || [];
            const totalApplications = applicationStats.reduce((sum, row) => sum + parseInt(row.count), 0);
            const totalCompletedApplications = applicationStats.find(row => row.status === 'completed')?.count || 0;
            const totalIgnoredApplications = applicationStats.find(row => row.status === 'ignored')?.count || 0;
            const totalLiveAuctions = applicationStats.find(row => row.status === 'live_auction')?.count || 0;
            const overallCompletionRate = totalApplications > 0 ? Math.round((totalCompletedApplications / totalApplications) * 100) : 0;

            return NextResponse.json({
                success: true,
                data: {
                    summary: {
                        total_applications: totalApplications,
                        total_completed_applications: totalCompletedApplications,
                        total_ignored_applications: totalIgnoredApplications,
                        total_live_auctions: totalLiveAuctions,
                        overall_completion_rate: overallCompletionRate,
                        recent_applications: applicationStats.reduce((sum, row) => sum + parseInt(row.count), 0)
                    },
                    by_status: data.application_stats || [],
                    by_city: data.city_stats || [],
                    by_sector: data.sector_stats || [],
                    trends: data.trends || [],
                    processing_time: data.processing_time?.[0] || {},
                    recent_activity: data.recent_activity || [],
                    bank_performance: data.bank_performance || []
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
