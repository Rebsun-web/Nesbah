import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import JWTUtils from '@/lib/auth/jwt-utils';

export async function GET(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Verify JWT token directly
        const jwtResult = JWTUtils.verifyToken(adminToken);
        
        if (!jwtResult.valid || !jwtResult.payload || jwtResult.payload.user_type !== 'admin_user') {
            console.log('🔧 Applications analytics: JWT verification failed:', jwtResult);
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid admin token' 
            }, { status: 401 });
        }

        const decoded = jwtResult.payload;

        // Get admin user from JWT payload
        const adminUser = {
            admin_id: decoded.admin_id,
            email: decoded.email,
            full_name: decoded.full_name,
            role: decoded.role,
            permissions: decoded.permissions,
            is_active: true
        };

        const client = await pool.connectWithRetry();
        
        try {
            // OPTIMIZED: Single comprehensive query for all application analytics using pos_application
            const comprehensiveQuery = `
                WITH application_stats AS (
                    SELECT 
                        COALESCE(pa.current_application_status, pa.status) as status,
                        COUNT(DISTINCT pa.application_id) as count
                    FROM pos_application pa
                    WHERE COALESCE(pa.current_application_status, pa.status) IN ('live_auction', 'completed', 'ignored')
                    GROUP BY COALESCE(pa.current_application_status, pa.status)
                ),
                city_stats AS (
                    SELECT 
                        pa.city,
                        COUNT(DISTINCT pa.application_id) as total_applications,
                        COUNT(DISTINCT CASE WHEN COALESCE(pa.current_application_status, pa.status) = 'completed' THEN pa.application_id END) as completed_applications,
                        COUNT(DISTINCT CASE WHEN COALESCE(pa.current_application_status, pa.status) = 'ignored' THEN pa.application_id END) as ignored_applications,
                        COUNT(DISTINCT CASE WHEN COALESCE(pa.current_application_status, pa.status) = 'live_auction' THEN pa.application_id END) as live_auction_applications
                    FROM pos_application pa
                    WHERE COALESCE(pa.current_application_status, pa.status) IN ('live_auction', 'ignored', 'completed')
                    GROUP BY pa.city
                ),
                sector_stats AS (
                    SELECT 
                        COALESCE(bu.sector, 'Unknown') as sector,
                        COUNT(DISTINCT pa.application_id) as total_applications,
                        COUNT(DISTINCT CASE WHEN COALESCE(pa.current_application_status, pa.status) = 'completed' THEN pa.application_id END) as completed_applications,
                        COUNT(DISTINCT CASE WHEN COALESCE(pa.current_application_status, pa.status) = 'ignored' THEN pa.application_id END) as ignored_applications,
                        COUNT(DISTINCT CASE WHEN COALESCE(pa.current_application_status, pa.status) = 'live_auction' THEN pa.application_id END) as live_auction_applications
                    FROM pos_application pa
                    JOIN business_users bu ON pa.business_user_id = bu.user_id
                    WHERE COALESCE(pa.current_application_status, pa.status) IN ('live_auction', 'ignored', 'completed')
                    GROUP BY bu.sector
                ),
                trends AS (
                    SELECT 
                        DATE_TRUNC('month', pa.submitted_at) as month,
                        COUNT(DISTINCT pa.application_id) as total_applications,
                        COUNT(DISTINCT CASE WHEN COALESCE(pa.current_application_status, pa.status) = 'completed' THEN pa.application_id END) as completed_applications,
                        COUNT(DISTINCT CASE WHEN COALESCE(pa.current_application_status, pa.status) = 'ignored' THEN pa.application_id END) as ignored_applications,
                        COUNT(DISTINCT CASE WHEN COALESCE(pa.current_application_status, pa.status) = 'live_auction' THEN pa.application_id END) as live_auction_applications
                    FROM pos_application pa
                    WHERE pa.submitted_at >= NOW() - INTERVAL '12 months'
                    AND COALESCE(pa.current_application_status, pa.status) IN ('live_auction', 'ignored', 'completed')
                    GROUP BY DATE_TRUNC('month', pa.submitted_at)
                ),
                processing_time AS (
                    SELECT 
                        ROUND(AVG(EXTRACT(EPOCH FROM (pa.offer_selection_end_time - pa.submitted_at)) / 86400), 2) as avg_processing_days,
                        ROUND(MIN(EXTRACT(EPOCH FROM (pa.offer_selection_end_time - pa.submitted_at)) / 86400), 2) as min_processing_days,
                        ROUND(MAX(EXTRACT(EPOCH FROM (pa.offer_selection_end_time - pa.submitted_at)) / 86400), 2) as max_processing_days,
                        COUNT(*) as total_completed_applications
                    FROM pos_application pa
                    WHERE COALESCE(pa.current_application_status, pa.status) = 'completed'
                    AND pa.submitted_at IS NOT NULL
                    AND pa.offer_selection_end_time IS NOT NULL
                ),
                recent_activity AS (
                    SELECT DISTINCT
                        pa.application_id,
                        COALESCE(pa.current_application_status, pa.status) as status,
                        pa.submitted_at,
                        pa.trade_name as business_name,
                        pa.city,
                        bu.sector,
                        pa.offers_count,
                        pa.revenue_collected
                    FROM pos_application pa
                    JOIN business_users bu ON pa.business_user_id = bu.user_id
                    WHERE pa.submitted_at >= NOW() - INTERVAL '7 days'
                    AND COALESCE(pa.current_application_status, pa.status) IN ('live_auction', 'ignored', 'completed')
                    ORDER BY pa.submitted_at DESC
                    LIMIT 20
                ),
                bank_performance AS (
                    SELECT 
                        u.entity_name as bank_name,
                        u.email as bank_email,
                        COUNT(DISTINCT pa.application_id) as total_applications,
                        COUNT(DISTINCT CASE WHEN bu.user_id = ANY(pa.purchased_by) THEN pa.application_id END) as applications_with_offers,
                        ROUND(
                            CASE 
                                WHEN COUNT(DISTINCT pa.application_id) > 0 
                                THEN (COUNT(DISTINCT CASE WHEN bu.user_id = ANY(pa.purchased_by) THEN pa.application_id END)::DECIMAL / COUNT(DISTINCT pa.application_id)) * 100 
                                ELSE 0 
                            END, 2
                        ) as conversion_rate,
                        ROUND(
                            AVG(EXTRACT(EPOCH FROM (bav.viewed_at - pa.submitted_at))/3600), 2
                        ) as avg_response_time_hours,
                        ROUND(
                            AVG(EXTRACT(EPOCH FROM (ao.submitted_at - bav.viewed_at))/3600), 2
                        ) as avg_offer_submission_time_hours
                    FROM pos_application pa
                    CROSS JOIN LATERAL unnest(pa.opened_by) AS opened_bank_id
                    JOIN bank_users bu ON opened_bank_id = bu.user_id
                    JOIN users u ON bu.user_id = u.user_id
                    LEFT JOIN bank_application_views bav ON pa.application_id = bav.application_id AND bu.user_id = bav.bank_user_id
                    LEFT JOIN application_offers ao ON pa.application_id = ao.submitted_application_id AND bu.user_id = ao.bank_user_id
                    WHERE u.user_type = 'bank_user'
                    GROUP BY u.entity_name, u.email, bu.user_id
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
