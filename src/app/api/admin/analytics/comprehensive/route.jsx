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
        const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
        const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0]; // today
        const bankUserId = searchParams.get('bank_user_id'); // optional filter

        const client = await pool.connectWithRetry();
        
        try {
            // 1. Overall Conversion Metrics using pos_application
            const overallMetricsQuery = `
                SELECT 
                    COUNT(DISTINCT pa.application_id) as total_applications,
                    COUNT(DISTINCT CASE WHEN array_length(pa.opened_by, 1) > 0 THEN pa.application_id END) as total_applications_viewed,
                    COUNT(DISTINCT CASE WHEN array_length(pa.purchased_by, 1) > 0 THEN pa.application_id END) as total_applications_purchased,
                    COUNT(DISTINCT CASE WHEN COALESCE(pa.current_application_status, pa.status) = 'completed' THEN pa.application_id END) as total_applications_completed,
                    COALESCE(SUM(pa.revenue_collected), 0) as total_revenue,
                    COALESCE(AVG(pa.offers_count), 0) as avg_offers_per_application,
                    ROUND(
                        COUNT(DISTINCT CASE WHEN array_length(pa.purchased_by, 1) > 0 THEN pa.application_id END) * 100.0 / 
                        NULLIF(COUNT(DISTINCT CASE WHEN array_length(pa.opened_by, 1) > 0 THEN pa.application_id END), 0), 2
                    ) as view_to_purchase_conversion_rate
                FROM pos_application pa
                WHERE pa.submitted_at BETWEEN $1 AND $2
            `;
            
            const overallMetrics = await client.query(overallMetricsQuery, [startDate, endDate]);

            // 2. Bank Performance Metrics using pos_application arrays
            let bankMetricsQuery = `
                SELECT 
                    bu.user_id as bank_user_id,
                    bu.entity_name as bank_name,
                    COUNT(DISTINCT pa.application_id) as total_applications_viewed,
                    COUNT(DISTINCT CASE WHEN bu.user_id = ANY(pa.purchased_by) THEN pa.application_id END) as total_offers_submitted,
                    ROUND(
                        COUNT(DISTINCT CASE WHEN bu.user_id = ANY(pa.purchased_by) THEN pa.application_id END) * 100.0 / 
                        NULLIF(COUNT(DISTINCT pa.application_id), 0), 2
                    ) as conversion_rate,
                    COALESCE(SUM(CASE WHEN bu.user_id = ANY(pa.purchased_by) THEN pa.revenue_collected ELSE 0 END), 0) as total_revenue_generated
                FROM pos_application pa
                CROSS JOIN LATERAL unnest(pa.opened_by) AS opened_bank_id
                JOIN bank_users bu ON opened_bank_id = bu.user_id
                WHERE pa.submitted_at BETWEEN $1 AND $2
            `;
            
            const bankMetricsParams = [startDate, endDate];
            
            if (bankUserId) {
                bankMetricsQuery += ` AND bu.user_id = $3`;
                bankMetricsParams.push(bankUserId);
            }
            
            bankMetricsQuery += `
                GROUP BY bu.user_id, bu.entity_name
                ORDER BY conversion_rate DESC, total_offers_submitted DESC
            `;
            
            const bankMetrics = await client.query(bankMetricsQuery, bankMetricsParams);

            // 3. Daily Trends using pos_application
            const dailyTrendsQuery = `
                SELECT 
                    DATE(pa.submitted_at) as metric_date,
                    COUNT(DISTINCT pa.application_id) as total_applications,
                    COUNT(DISTINCT CASE WHEN array_length(pa.opened_by, 1) > 0 THEN pa.application_id END) as total_applications_viewed,
                    COUNT(DISTINCT CASE WHEN array_length(pa.purchased_by, 1) > 0 THEN pa.application_id END) as total_offers_submitted,
                    ROUND(
                        COUNT(DISTINCT CASE WHEN array_length(pa.purchased_by, 1) > 0 THEN pa.application_id END) * 100.0 / 
                        NULLIF(COUNT(DISTINCT CASE WHEN array_length(pa.opened_by, 1) > 0 THEN pa.application_id END), 0), 2
                    ) as view_to_purchase_conversion_rate,
                    COALESCE(SUM(pa.revenue_collected), 0) as total_revenue
                FROM pos_application pa
                WHERE pa.submitted_at BETWEEN $1 AND $2
                GROUP BY DATE(pa.submitted_at)
                ORDER BY metric_date DESC
            `;
            
            const dailyTrends = await client.query(dailyTrendsQuery, [startDate, endDate]);

            // 4. Top Performing Banks (last 7 days) using pos_application
            const topBanksQuery = `
                SELECT 
                    bu.entity_name as bank_name,
                    COUNT(DISTINCT pa.application_id) as total_applications_viewed,
                    COUNT(DISTINCT CASE WHEN bu.user_id = ANY(pa.purchased_by) THEN pa.application_id END) as total_offers_submitted,
                    ROUND(
                        COUNT(DISTINCT CASE WHEN bu.user_id = ANY(pa.purchased_by) THEN pa.application_id END) * 100.0 / 
                        NULLIF(COUNT(DISTINCT pa.application_id), 0), 2
                    ) as conversion_rate,
                    COALESCE(SUM(CASE WHEN bu.user_id = ANY(pa.purchased_by) THEN pa.revenue_collected ELSE 0 END), 0) as total_revenue_generated
                FROM pos_application pa
                CROSS JOIN LATERAL unnest(pa.opened_by) AS opened_bank_id
                JOIN bank_users bu ON opened_bank_id = bu.user_id
                WHERE pa.submitted_at >= $1
                GROUP BY bu.user_id, bu.entity_name
                HAVING COUNT(DISTINCT pa.application_id) > 0
                ORDER BY conversion_rate DESC, total_offers_submitted DESC
                LIMIT 10
            `;
            
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const topBanks = await client.query(topBanksQuery, [sevenDaysAgo]);

            // 5. Application Status Distribution using pos_application
            const statusDistributionQuery = `
                SELECT 
                    COALESCE(pa.current_application_status, pa.status) as status,
                    COUNT(*) as count,
                    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
                FROM pos_application pa
                WHERE pa.submitted_at BETWEEN $1 AND $2
                GROUP BY COALESCE(pa.current_application_status, pa.status)
                ORDER BY count DESC
            `;
            
            const statusDistribution = await client.query(statusDistributionQuery, [startDate, endDate]);

            // 6. Bank Engagement Metrics using pos_application arrays
            const engagementMetricsQuery = `
                SELECT 
                    COUNT(DISTINCT pa.application_id) as total_applications,
                    COUNT(DISTINCT CASE WHEN array_length(pa.opened_by, 1) > 0 THEN pa.application_id END) as total_applications_viewed,
                    COUNT(DISTINCT CASE WHEN array_length(pa.purchased_by, 1) > 0 THEN pa.application_id END) as total_offers_submitted,
                    COALESCE(AVG(array_length(pa.opened_by, 1)), 0) as avg_banks_per_application,
                    COALESCE(AVG(array_length(pa.purchased_by, 1)), 0) as avg_purchases_per_application
                FROM pos_application pa
                WHERE pa.submitted_at BETWEEN $1 AND $2
            `;
            
            const engagementMetrics = await client.query(engagementMetricsQuery, [startDate, endDate]);

            return NextResponse.json({
                success: true,
                data: {
                    period: { start_date: startDate, end_date: endDate },
                    overall_metrics: overallMetrics.rows[0],
                    bank_performance: bankMetrics.rows,
                    daily_trends: dailyTrends.rows,
                    top_performing_banks: topBanks.rows,
                    status_distribution: statusDistribution.rows,
                    engagement_metrics: engagementMetrics.rows[0]
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch analytics data' },
            { status: 500 }
        );
    }
}
