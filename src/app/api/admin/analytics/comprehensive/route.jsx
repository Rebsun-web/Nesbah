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

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
        const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0]; // today
        const bankUserId = searchParams.get('bank_user_id'); // optional filter

        const client = await pool.connect();
        
        try {
            // 1. Overall Conversion Metrics
            const overallMetricsQuery = `
                SELECT 
                    SUM(total_applications) as total_applications,
                    SUM(total_applications_viewed) as total_applications_viewed,
                    SUM(total_offers_submitted) as total_offers_submitted,
                    SUM(total_applications_purchased) as total_applications_purchased,
                    SUM(total_applications_completed) as total_applications_completed,
                    AVG(view_to_offer_conversion_rate) as avg_view_to_offer_rate,
                    AVG(offer_to_purchase_conversion_rate) as avg_offer_to_purchase_rate,
                    AVG(overall_conversion_rate) as avg_overall_conversion_rate,
                    AVG(avg_time_to_first_offer_minutes) as avg_time_to_first_offer,
                    SUM(total_revenue) as total_revenue
                FROM application_conversion_metrics 
                WHERE metric_date BETWEEN $1 AND $2
            `;
            
            const overallMetrics = await client.query(overallMetricsQuery, [startDate, endDate]);

            // 2. Bank Performance Metrics
            let bankMetricsQuery = `
                SELECT 
                    tm.bank_user_id,
                    tm.bank_name,
                    SUM(tm.total_applications_viewed) as total_applications_viewed,
                    SUM(tm.total_offers_submitted) as total_offers_submitted,
                    AVG(tm.conversion_rate) as avg_conversion_rate,
                    AVG(tm.avg_time_to_open_minutes) as avg_time_to_open,
                    AVG(tm.avg_time_to_submit_minutes) as avg_time_to_submit,
                    SUM(tm.total_revenue_generated) as total_revenue_generated,
                    COUNT(DISTINCT tm.metric_date) as active_days
                FROM time_metrics tm
                WHERE tm.metric_date BETWEEN $1 AND $2
            `;
            
            const bankMetricsParams = [startDate, endDate];
            
            if (bankUserId) {
                bankMetricsQuery += ` AND tm.bank_user_id = $3`;
                bankMetricsParams.push(bankUserId);
            }
            
            bankMetricsQuery += `
                GROUP BY tm.bank_user_id, tm.bank_name
                ORDER BY avg_conversion_rate DESC, total_offers_submitted DESC
            `;
            
            const bankMetrics = await client.query(bankMetricsQuery, bankMetricsParams);

            // 3. Daily Trends
            const dailyTrendsQuery = `
                SELECT 
                    metric_date,
                    total_applications,
                    total_applications_viewed,
                    total_offers_submitted,
                    view_to_offer_conversion_rate,
                    offer_to_purchase_conversion_rate,
                    overall_conversion_rate,
                    total_revenue
                FROM application_conversion_metrics 
                WHERE metric_date BETWEEN $1 AND $2
                ORDER BY metric_date DESC
            `;
            
            const dailyTrends = await client.query(dailyTrendsQuery, [startDate, endDate]);

            // 4. Top Performing Banks (last 7 days)
            const topBanksQuery = `
                SELECT 
                    tm.bank_name,
                    tm.conversion_rate,
                    tm.total_applications_viewed,
                    tm.total_offers_submitted,
                    tm.avg_time_to_open_minutes,
                    tm.avg_time_to_submit_minutes,
                    tm.total_revenue_generated
                FROM time_metrics tm
                WHERE tm.metric_date >= $1
                AND tm.total_applications_viewed > 0
                ORDER BY tm.conversion_rate DESC, tm.total_offers_submitted DESC
                LIMIT 10
            `;
            
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const topBanks = await client.query(topBanksQuery, [sevenDaysAgo]);

            // 5. Application Status Distribution
            const statusDistributionQuery = `
                SELECT 
                    status,
                    COUNT(*) as count,
                    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
                FROM submitted_applications 
                WHERE submitted_at BETWEEN $1 AND $2
                GROUP BY status
                ORDER BY count DESC
            `;
            
            const statusDistribution = await client.query(statusDistributionQuery, [startDate, endDate]);

            // 6. Time-based Performance Metrics
            const timeMetricsQuery = `
                SELECT 
                    AVG(bav.time_to_open_minutes) as avg_time_to_open,
                    AVG(bos.time_to_submit_minutes) as avg_time_to_submit,
                    COUNT(DISTINCT bav.application_id) as total_applications_viewed,
                    COUNT(DISTINCT bos.application_id) as total_offers_submitted
                FROM bank_application_views bav
                LEFT JOIN bank_offer_submissions bos ON bav.application_id = bos.application_id 
                    AND bav.bank_user_id = bos.bank_user_id
                WHERE bav.viewed_at BETWEEN $1 AND $2
            `;
            
            const timeMetrics = await client.query(timeMetricsQuery, [startDate, endDate]);

            return NextResponse.json({
                success: true,
                data: {
                    period: { start_date: startDate, end_date: endDate },
                    overall_metrics: overallMetrics.rows[0],
                    bank_performance: bankMetrics.rows,
                    daily_trends: dailyTrends.rows,
                    top_performing_banks: topBanks.rows,
                    status_distribution: statusDistribution.rows,
                    time_metrics: timeMetrics.rows[0]
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
