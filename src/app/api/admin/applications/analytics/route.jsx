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

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_applications_analytics_route.jsx_route');
        
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
                        pa.sector,
                        COUNT(DISTINCT pa.application_id) as total_applications,
                        COUNT(DISTINCT CASE WHEN COALESCE(pa.current_application_status, pa.status) = 'completed' THEN pa.application_id END) as completed_applications,
                        COUNT(DISTINCT CASE WHEN COALESCE(pa.current_application_status, pa.status) = 'ignored' THEN pa.application_id END) as ignored_applications,
                        COUNT(DISTINCT CASE WHEN COALESCE(pa.current_application_status, pa.status) = 'live_auction' THEN pa.application_id END) as live_auction_applications
                    FROM pos_application pa
                    WHERE COALESCE(pa.current_application_status, pa.status) IN ('live_auction', 'ignored', 'completed')
                    GROUP BY pa.sector
                ),
                monthly_trends AS (
                    SELECT 
                        DATE_TRUNC('month', pa.submitted_at) as month,
                        COUNT(DISTINCT pa.application_id) as total_applications,
                        COUNT(DISTINCT CASE WHEN COALESCE(pa.current_application_status, pa.status) = 'completed' THEN pa.application_id END) as completed_applications,
                        COUNT(DISTINCT CASE WHEN COALESCE(pa.current_application_status, pa.status) = 'ignored' THEN pa.application_id END) as ignored_applications,
                        COUNT(DISTINCT CASE WHEN COALESCE(pa.current_application_status, pa.status) = 'live_auction' THEN pa.application_id END) as live_auction_applications
                    FROM pos_application pa
                    WHERE COALESCE(pa.current_application_status, pa.status) IN ('live_auction', 'ignored', 'completed')
                    GROUP BY DATE_TRUNC('month', pa.submitted_at)
                    ORDER BY month DESC
                    LIMIT 12
                ),
                offer_stats AS (
                    SELECT 
                        COUNT(DISTINCT ao.offer_id) as total_offers,
                        COUNT(DISTINCT ao.submitted_application_id) as applications_with_offers,
                        AVG(ao.approved_financing_amount) as avg_financing_amount,
                        SUM(ao.approved_financing_amount) as total_financing_amount
                    FROM application_offers ao
                    JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
                    WHERE COALESCE(pa.current_application_status, pa.status) IN ('live_auction', 'completed')
                )
                SELECT 
                    (SELECT json_agg(application_stats.*) FROM application_stats) as status_counts,
                    (SELECT json_agg(city_stats.*) FROM city_stats) as city_stats,
                    (SELECT json_agg(sector_stats.*) FROM sector_stats) as sector_stats,
                    (SELECT json_agg(monthly_trends.*) FROM monthly_trends) as monthly_trends,
                    (SELECT json_agg(offer_stats.*) FROM offer_stats) as offer_stats
            `;
            
            const result = await client.query(comprehensiveQuery);
            
            if (result.rows.length === 0) {
                return NextResponse.json({
                    success: true,
                    data: {
                        status_counts: [],
                        city_stats: [],
                        sector_stats: [],
                        monthly_trends: [],
                        offer_stats: []
                    }
                });
            }
            
            const analyticsData = result.rows[0];
            
            return NextResponse.json({
                success: true,
                data: {
                    status_counts: analyticsData.status_counts || [],
                    city_stats: analyticsData.city_stats || [],
                    sector_stats: analyticsData.sector_stats || [],
                    monthly_trends: analyticsData.monthly_trends || [],
                    offer_stats: analyticsData.offer_stats || []
                }
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Applications analytics error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch applications analytics' },
            { status: 500 }
        );
    }
}
