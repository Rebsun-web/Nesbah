import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

export async function GET(req) {
    try {
        // Verify admin authentication
        const adminUser = await AdminAuth.verifyAdmin(req);
        if (!adminUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const timeRange = searchParams.get('timeRange') || '30d';

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeRange) {
            case '7d':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(endDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(endDate.getDate() - 90);
                break;
            case '1y':
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
            default:
                startDate.setDate(endDate.getDate() - 30);
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_analytics_bank-performance_route.jsx_route');
        
        try {
            // 1. Lead View Rate Query - Use same status logic as applications table
            const leadViewRateQuery = `
                SELECT 
                    COUNT(*) as total_applications,
                    COUNT(CASE WHEN pa.offers_count > 0 THEN 1 END) as viewed_applications,
                    ROUND((COUNT(CASE WHEN pa.offers_count > 0 THEN 1 END) * 100.0 / COUNT(*)), 2) as view_rate
                FROM pos_application pa
                WHERE pa.submitted_at >= $1 AND pa.submitted_at <= $2
                AND COALESCE(pa.current_application_status, pa.status) IN ('live_auction', 'completed')
            `;
            const leadViewRate = await client.query(leadViewRateQuery, [startDate, endDate]);

            // 2. Offer Submission Rate Query - Use same status logic as applications table
            const offerSubmissionRateQuery = `
                SELECT 
                    COUNT(*) as total_viewed_applications,
                    COUNT(CASE WHEN pa.offers_count > 0 THEN 1 END) as applications_with_offers,
                    ROUND((COUNT(CASE WHEN pa.offers_count > 0 THEN 1 END) * 100.0 / COUNT(*)), 2) as submission_rate
                FROM pos_application pa
                WHERE pa.submitted_at >= $1 AND pa.submitted_at <= $2
                AND COALESCE(pa.current_application_status, pa.status) IN ('live_auction', 'completed')
            `;
            const offerSubmissionRate = await client.query(offerSubmissionRateQuery, [startDate, endDate]);

            // 3. Bank Response Time Distribution Query
            const responseTimeDistributionQuery = `
                SELECT 
                    COUNT(*) as total_offers,
                    ROUND(AVG(EXTRACT(EPOCH FROM (ao.submitted_at - pa.submitted_at)) / 3600), 2) as avg_response_hours,
                    ROUND(MIN(EXTRACT(EPOCH FROM (ao.submitted_at - pa.submitted_at)) / 3600), 2) as min_response_hours,
                    ROUND(MAX(EXTRACT(EPOCH FROM (ao.submitted_at - pa.submitted_at)) / 3600), 2) as max_response_hours
                FROM application_offers ao
                JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
                WHERE ao.submitted_at >= $1 AND ao.submitted_at <= $2
                AND ao.submitted_at IS NOT NULL
                AND pa.submitted_at IS NOT NULL
            `;
            const responseTimeDistribution = await client.query(responseTimeDistributionQuery, [startDate, endDate]);

            // 4. Bank Performance Ranking Query - Count from opened_by and purchased_by arrays
            const bankPerformanceRankingQuery = `
                WITH bank_stats AS (
                    SELECT 
                        bu.user_id,
                        COALESCE(u.entity_name, 'Unknown Bank') as bank_name,
                        -- Count applications viewed (from opened_by array)
                        COUNT(DISTINCT CASE WHEN pa.opened_by @> ARRAY[bu.user_id] THEN pa.application_id END) as applications_viewed,
                        -- Count applications purchased/offers submitted (from purchased_by array)
                        COUNT(DISTINCT CASE WHEN pa.purchased_by @> ARRAY[bu.user_id] THEN pa.application_id END) as offers_submitted
                    FROM bank_users bu
                    LEFT JOIN users u ON bu.user_id = u.user_id
                    LEFT JOIN pos_application pa ON 
                        pa.submitted_at >= $1 AND 
                        pa.submitted_at <= $2 AND
                        (pa.opened_by @> ARRAY[bu.user_id] OR pa.purchased_by @> ARRAY[bu.user_id])
                    GROUP BY bu.user_id, u.entity_name
                )
                SELECT 
                    bank_name,
                    applications_viewed,
                    offers_submitted,
                    CASE 
                        WHEN applications_viewed > 0 THEN 
                            ROUND((offers_submitted::decimal / applications_viewed * 100), 2)
                        ELSE 0 
                    END as conversion_rate
                FROM bank_stats
                WHERE applications_viewed > 0 OR offers_submitted > 0
                ORDER BY offers_submitted DESC, applications_viewed DESC
            `;
            const bankPerformanceRanking = await client.query(bankPerformanceRankingQuery, [startDate, endDate]);
            
            // Debug: Log the bank performance data
            console.log('🔍 Bank Performance Debug:');
            console.log('  - Bank performance ranking:', bankPerformanceRanking.rows);
            console.log('  - Number of banks found:', bankPerformanceRanking.rows.length);
            console.log('  - Sample bank data:', bankPerformanceRanking.rows[0]);
            
            // Debug: Check actual array data in applications
            const arrayDataDebugQuery = `
                SELECT 
                    application_id,
                    opened_by,
                    purchased_by,
                    status,
                    submitted_at
                FROM pos_application 
                WHERE submitted_at >= $1 AND submitted_at <= $2
                AND (opened_by IS NOT NULL OR purchased_by IS NOT NULL)
                ORDER BY submitted_at DESC
                LIMIT 5
            `;
            const arrayDataDebug = await client.query(arrayDataDebugQuery, [startDate, endDate]);
            console.log('🔍 Array Data Debug:');
            console.log('  - Sample applications with arrays:', arrayDataDebug.rows);

            // 5. Lead Quality Metrics Query
            const leadQualityMetricsQuery = `
                SELECT 
                    COUNT(*) as total_applications,
                    COUNT(CASE WHEN pa.status = 'completed' THEN 1 END) as successful_applications,
                    ROUND((COUNT(CASE WHEN pa.status = 'completed' THEN 1 END) * 100.0 / COUNT(*)), 2) as success_rate,
                    ROUND(AVG(pa.offers_count), 2) as avg_offers_per_application
                FROM pos_application pa
                WHERE pa.submitted_at >= $1 AND pa.submitted_at <= $2
            `;
            const leadQualityMetrics = await client.query(leadQualityMetricsQuery, [startDate, endDate]);

            // 6. Competitive Analysis Query
            const competitiveAnalysisQuery = `
                SELECT 
                    COUNT(*) as total_applications,
                    COUNT(CASE WHEN pa.offers_count > 1 THEN 1 END) as competitive_applications,
                    ROUND((COUNT(CASE WHEN pa.offers_count > 1 THEN 1 END) * 100.0 / COUNT(*)), 2) as competition_rate,
                    ROUND(AVG(pa.offers_count), 2) as avg_competition_level
                FROM pos_application pa
                WHERE pa.submitted_at >= $1 AND pa.submitted_at <= $2
                AND pa.status IN ('live_auction', 'completed')
            `;
            const competitiveAnalysis = await client.query(competitiveAnalysisQuery, [startDate, endDate]);

            return NextResponse.json({
                success: true,
                data: {
                    lead_view_rate: leadViewRate.rows[0],
                    offer_submission_rate: offerSubmissionRate.rows[0],
                    response_time_distribution: responseTimeDistribution.rows[0],
                    bank_performance_ranking: bankPerformanceRanking.rows,
                    lead_quality_metrics: leadQualityMetrics.rows[0],
                    competitive_analysis: competitiveAnalysis.rows[0]
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Bank performance analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
