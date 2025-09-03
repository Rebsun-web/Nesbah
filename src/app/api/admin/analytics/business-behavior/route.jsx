import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

export async function GET(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 })
        }

        // Validate admin session using session manager
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken)
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 })
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

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_analytics_business-behavior_route.jsx_route');
        
        try {
            // 1. Application Amount Distribution Query
            const amountDistributionQuery = `
                SELECT 
                    COUNT(*) as total_applications,
                    ROUND(AVG(COALESCE(bu.cr_capital, 0)), 2) as avg_amount,
                    ROUND(MIN(COALESCE(bu.cr_capital, 0)), 2) as min_amount,
                    ROUND(MAX(COALESCE(bu.cr_capital, 0)), 2) as max_amount
                FROM pos_application pa
                JOIN business_users bu ON pa.user_id = bu.user_id
                WHERE pa.submitted_at >= $1 AND pa.submitted_at <= $2
            `;
            const amountDistributionResult = await client.query(amountDistributionQuery, [startDate, endDate]);

            // 2. Amount Range Breakdown Query
            const amountRangesQuery = `
                WITH amount_ranges AS (
                    SELECT 
                        CASE 
                            WHEN COALESCE(bu.cr_capital, 0) < 10000 THEN 'Under 10K'
                            WHEN COALESCE(bu.cr_capital, 0) < 50000 THEN '10K - 50K'
                            WHEN COALESCE(bu.cr_capital, 0) < 100000 THEN '50K - 100K'
                            WHEN COALESCE(bu.cr_capital, 0) < 500000 THEN '100K - 500K'
                            ELSE 'Over 500K'
                        END as amount_range,
                        COUNT(*) as count,
                        ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ()), 2) as percentage
                    FROM pos_application pa
                    JOIN business_users bu ON pa.user_id = bu.user_id
                    WHERE pa.submitted_at >= $1 AND pa.submitted_at <= $2
                    GROUP BY 
                        CASE 
                            WHEN COALESCE(bu.cr_capital, 0) < 10000 THEN 'Under 10K'
                            WHEN COALESCE(bu.cr_capital, 0) < 50000 THEN '10K - 50K'
                            WHEN COALESCE(bu.cr_capital, 0) < 100000 THEN '50K - 100K'
                            WHEN COALESCE(bu.cr_capital, 0) < 500000 THEN '100K - 500K'
                            ELSE 'Over 500K'
                        END
                )
                SELECT * FROM amount_ranges
                ORDER BY 
                    CASE amount_range
                        WHEN 'Under 10K' THEN 1
                        WHEN '10K - 50K' THEN 2
                        WHEN '50K - 100K' THEN 3
                        WHEN '100K - 500K' THEN 4
                        ELSE 5
                    END
            `;
            const amountRanges = await client.query(amountRangesQuery, [startDate, endDate]);

            // 3. Business Patterns Analysis Query
            const businessPatternsQuery = `
                SELECT 
                    COUNT(*) as total_applications,
                    COUNT(CASE WHEN pa.status = 'completed' THEN 1 END) as completed_applications,
                    COUNT(CASE WHEN pa.status = 'live_auction' THEN 1 END) as live_auctions,
                    COUNT(CASE WHEN pa.status = 'expired' THEN 1 END) as expired_applications,
                    ROUND((COUNT(CASE WHEN pa.status = 'completed' THEN 1 END) * 100.0 / COUNT(*)), 2) as completion_rate
                FROM pos_application pa
                WHERE pa.submitted_at >= $1 AND pa.submitted_at <= $2
            `;
            const businessPatterns = await client.query(businessPatternsQuery, [startDate, endDate]);

            // 4. Geographic Behavior Query
            const geographicBehaviorQuery = `
                SELECT 
                    COALESCE(bu.city, 'Unknown') as city,
                    COUNT(*) as application_count,
                    ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ()), 2) as percentage
                FROM pos_application pa
                JOIN business_users bu ON pa.user_id = bu.user_id
                WHERE pa.submitted_at >= $1 AND pa.submitted_at <= $2
                GROUP BY bu.city
                ORDER BY application_count DESC
                LIMIT 10
            `;
            const geographicBehavior = await client.query(geographicBehaviorQuery, [startDate, endDate]);

            // 5. Seasonal Business Behavior Query
            const seasonalBehaviorQuery = `
                SELECT 
                    EXTRACT(MONTH FROM pa.submitted_at) as month,
                    COUNT(*) as application_count,
                    ROUND(AVG(COALESCE(bu.cr_capital, 0)), 2) as avg_capital
                FROM pos_application pa
                JOIN business_users bu ON pa.user_id = bu.user_id
                WHERE pa.submitted_at >= $1 AND pa.submitted_at <= $2
                GROUP BY EXTRACT(MONTH FROM pa.submitted_at)
                ORDER BY month
            `;
            const seasonalBehavior = await client.query(seasonalBehaviorQuery, [startDate, endDate]);

            // 6. Business Size Analysis Query
            const businessSizeAnalysisQuery = `
                WITH business_sizes AS (
                    SELECT 
                        CASE 
                            WHEN COALESCE(bu.cr_capital, 0) < 10000 THEN 'Small'
                            WHEN COALESCE(bu.cr_capital, 0) < 100000 THEN 'Medium'
                            WHEN COALESCE(bu.cr_capital, 0) < 1000000 THEN 'Large'
                            ELSE 'Enterprise'
                        END as business_size,
                        COUNT(*) as count,
                        ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ()), 2) as percentage,
                        ROUND(AVG(COALESCE(bu.cr_capital, 0)), 2) as avg_amount
                    FROM pos_application pa
                    JOIN business_users bu ON pa.user_id = bu.user_id
                    WHERE pa.submitted_at >= $1 AND pa.submitted_at <= $2
                    GROUP BY 
                        CASE 
                            WHEN COALESCE(bu.cr_capital, 0) < 10000 THEN 'Small'
                            WHEN COALESCE(bu.cr_capital, 0) < 100000 THEN 'Medium'
                            WHEN COALESCE(bu.cr_capital, 0) < 1000000 THEN 'Large'
                            ELSE 'Enterprise'
                        END
                )
                SELECT * FROM business_sizes
                ORDER BY 
                    CASE business_size
                        WHEN 'Small' THEN 1
                        WHEN 'Medium' THEN 2
                        WHEN 'Large' THEN 3
                        ELSE 4
                    END
            `;
            const businessSizeAnalysis = await client.query(businessSizeAnalysisQuery, [startDate, endDate]);

            // Debug logging
            console.log('Business Size Analysis Results:', businessSizeAnalysis.rows);
            console.log('Date Range:', { startDate, endDate });

            // Transform business size analysis into the format expected by frontend
            const amountDistribution = {
                small_business: businessSizeAnalysis.rows.find(row => row.business_size === 'Small') || { count: 0, percentage: 0, avg_amount: 0 },
                medium_business: businessSizeAnalysis.rows.find(row => row.business_size === 'Medium') || { count: 0, percentage: 0, avg_amount: 0 },
                large_business: businessSizeAnalysis.rows.find(row => row.business_size === 'Large') || { count: 0, percentage: 0, avg_amount: 0 },
                enterprise: businessSizeAnalysis.rows.find(row => row.business_size === 'Enterprise') || { count: 0, percentage: 0, avg_amount: 0 }
            };

            return NextResponse.json({
                success: true,
                data: {
                    amount_distribution: amountDistribution,
                    amount_ranges: amountRanges.rows,
                    business_patterns: businessPatterns.rows[0],
                    geographic_behavior: geographicBehavior.rows,
                    seasonal_behavior: seasonalBehavior.rows,
                    business_size_analysis: businessSizeAnalysis.rows
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Business behavior analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
