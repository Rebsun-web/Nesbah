import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { withAdminSession, getAdminUserFromRequest } from '@/lib/auth/admin-session-middleware';

export const GET = withAdminSession(async (req) => {
    try {
        // Get admin user from session (no database query needed)
        const adminUser = getAdminUserFromRequest(req);

        const { searchParams } = new URL(req.url);
        const timeRange = searchParams.get('timeRange') || '7d';
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const client = await pool.connectWithRetry();
        
        try {
            // Calculate date range based on timeRange parameter
            let dateParams = [];
            
            if (startDate && endDate) {
                dateParams = [startDate, endDate];
            } else {
                const now = new Date();
                let startDate;
                
                switch (timeRange) {
                    case '7d':
                        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case '30d':
                        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                    case '90d':
                        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                }
                
                dateParams = [startDate.toISOString()];
            }

            // OPTIMIZED: Single comprehensive query for all revenue analytics
            const comprehensiveRevenueQuery = `
                WITH current_period_revenue AS (
                    SELECT 
                        COALESCE(SUM(ao.deal_value * 0.03), 0) as total_revenue,
                        COUNT(DISTINCT CASE WHEN ao.status = 'submitted' THEN sa.application_id END) as revenue_generating_applications,
                        CASE 
                            WHEN COUNT(DISTINCT CASE WHEN ao.status = 'submitted' THEN sa.application_id END) > 0 
                            THEN COALESCE(SUM(ao.deal_value * 0.03), 0) / COUNT(DISTINCT CASE WHEN ao.status = 'submitted' THEN sa.application_id END)
                            ELSE 0 
                        END as avg_revenue_per_application,
                        COUNT(DISTINCT CASE WHEN COALESCE(aot.current_application_status, sa.status) = 'completed' THEN sa.application_id END) as completed_applications,
                        COUNT(DISTINCT CASE WHEN COALESCE(aot.current_application_status, sa.status) = 'ignored' THEN sa.application_id END) as ignored_applications,
                        COUNT(DISTINCT CASE WHEN COALESCE(aot.current_application_status, sa.status) = 'live_auction' THEN sa.application_id END) as active_auctions,
                        COUNT(DISTINCT sa.application_id) as total_applications
                    FROM submitted_applications sa
                    LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
                    LEFT JOIN application_offers ao ON sa.id = ao.submitted_application_id
                    WHERE sa.submitted_at >= $1
                ),
                previous_period_revenue AS (
                    SELECT 
                        COALESCE(SUM(ao.deal_value * 0.03), 0) as total_revenue,
                        COUNT(DISTINCT CASE WHEN ao.status = 'submitted' THEN sa.application_id END) as revenue_generating_applications,
                        CASE 
                            WHEN COUNT(DISTINCT CASE WHEN ao.status = 'submitted' THEN sa.application_id END) > 0 
                            THEN COALESCE(SUM(ao.deal_value * 0.03), 0) / COUNT(DISTINCT CASE WHEN ao.status = 'submitted' THEN sa.application_id END)
                            ELSE 0 
                        END as avg_revenue_per_application,
                        COUNT(DISTINCT CASE WHEN COALESCE(aot.current_application_status, sa.status) = 'completed' THEN sa.application_id END) as completed_applications,
                        COUNT(DISTINCT sa.application_id) as total_applications
                    FROM submitted_applications sa
                    LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
                    LEFT JOIN application_offers ao ON sa.id = ao.submitted_application_id
                    WHERE sa.submitted_at >= $2 AND sa.submitted_at < $3
                ),
                daily_trend AS (
                    SELECT 
                        DATE_TRUNC('day', sa.submitted_at) as date,
                        COUNT(DISTINCT sa.application_id) as applications,
                        COALESCE(SUM(ao.deal_value * 0.03), 0) as revenue,
                        COUNT(DISTINCT CASE WHEN ao.status = 'submitted' THEN sa.application_id END) as revenue_generating_applications
                    FROM submitted_applications sa
                    LEFT JOIN application_offers ao ON sa.id = ao.submitted_application_id
                    WHERE sa.submitted_at >= $1
                    GROUP BY DATE_TRUNC('day', sa.submitted_at)
                    ORDER BY date
                ),
                bank_performance AS (
                    SELECT 
                        u.entity_name as bank_name,
                        COUNT(DISTINCT sa.application_id) as total_applications,
                        COUNT(DISTINCT CASE WHEN ao.status = 'submitted' THEN sa.application_id END) as applications_with_offers,
                        COALESCE(SUM(ao.deal_value * 0.03), 0) as total_revenue,
                        ROUND(
                            CASE 
                                WHEN COUNT(DISTINCT sa.application_id) > 0 
                                THEN (COUNT(DISTINCT CASE WHEN ao.status = 'submitted' THEN sa.application_id END)::DECIMAL / COUNT(DISTINCT sa.application_id)) * 100 
                                ELSE 0 
                            END, 2
                        ) as conversion_rate
                    FROM submitted_applications sa
                    LEFT JOIN application_offers ao ON sa.id = ao.submitted_application_id
                    LEFT JOIN users u ON ao.bank_user_id = u.user_id
                    WHERE sa.submitted_at >= $1 AND u.user_type = 'bank_user'
                    GROUP BY u.entity_name, u.user_id
                    ORDER BY total_revenue DESC
                    LIMIT 10
                )
                SELECT 
                    'current_period' as data_type,
                    json_agg(current_period_revenue.*) as data
                FROM current_period_revenue
                
                UNION ALL
                
                SELECT 
                    'previous_period' as data_type,
                    json_agg(previous_period_revenue.*) as data
                FROM previous_period_revenue
                
                UNION ALL
                
                SELECT 
                    'daily_trend' as data_type,
                    json_agg(daily_trend.*) as data
                FROM daily_trend
                
                UNION ALL
                
                SELECT 
                    'bank_performance' as data_type,
                    json_agg(bank_performance.*) as data
                FROM bank_performance
            `;

            // Calculate date parameters
            const currentStartDate = dateParams[0];
            const currentEndDate = dateParams[1] || new Date().toISOString();
            
            const currentStart = new Date(currentStartDate);
            const currentEnd = new Date(currentEndDate);
            const periodDuration = currentEnd.getTime() - currentStart.getTime();
            
            const previousStart = new Date(currentStart.getTime() - periodDuration);
            const previousEnd = new Date(currentStart.getTime());

            const queryParams = [
                currentStartDate,
                previousStart.toISOString(),
                previousEnd.toISOString()
            ];

            const result = await client.query(comprehensiveRevenueQuery, queryParams);
            
            // Parse the results
            const data = {};
            result.rows.forEach(row => {
                data[row.data_type] = row.data;
            });

            // Calculate changes
            const current = data.current_period?.[0] || {};
            const previous = data.previous_period?.[0] || {};
            
            const revenueChange = previous.total_revenue > 0 ? 
                ((current.total_revenue - previous.total_revenue) / previous.total_revenue) * 100 : 0;
            
            const appsChange = previous.total_applications > 0 ? 
                ((current.total_applications - previous.total_applications) / previous.total_applications) * 100 : 0;
            
            const avgRevenueChange = previous.avg_revenue_per_application > 0 ? 
                ((current.avg_revenue_per_application - previous.avg_revenue_per_application) / previous.avg_revenue_per_application) * 100 : 0;
            
            const completedChange = previous.completed_applications > 0 ? 
                ((current.completed_applications - previous.completed_applications) / previous.completed_applications) * 100 : 0;

            // Calculate conversion and abandonment rates
            const conversionRate = current.total_applications > 0 ? 
                (current.revenue_generating_applications / current.total_applications) * 100 : 0;
            
            const abandonmentRate = current.total_applications > 0 ? 
                (current.ignored_applications / current.total_applications) * 100 : 0;

            // Generate insights
            const insights = {
                positive: [],
                improvement: []
            };

            if (revenueChange > 0) {
                insights.positive.push(`Revenue increased ${revenueChange.toFixed(1)}% this period`);
            }
            if (conversionRate > 60) {
                insights.positive.push(`Lead conversion rate is strong at ${conversionRate.toFixed(1)}%`);
            } else if (conversionRate > 40) {
                insights.positive.push(`Lead conversion rate is improving at ${conversionRate.toFixed(1)}%`);
            }
            if (current.completed_applications > 0) {
                insights.positive.push(`${current.completed_applications} leads sold successfully`);
            }
            if (current.revenue_generating_applications > 0) {
                insights.positive.push(`${current.revenue_generating_applications} leads generated revenue (25 SAR each)`);
            }
            if (current.active_auctions > 0) {
                insights.positive.push(`${current.active_auctions} applications have active offer selections`);
            }
            if (current.total_revenue > 0) {
                insights.positive.push(`Total lead sales: ${current.total_revenue / 25} leads sold`);
            }

            if (abandonmentRate > 15) {
                insights.improvement.push(`High abandonment rate: ${abandonmentRate.toFixed(1)}% - consider improving application process`);
            } else if (abandonmentRate > 5) {
                insights.improvement.push(`Moderate abandonment rate: ${abandonmentRate.toFixed(1)}% - monitor application flow`);
            }
            if (current.active_auctions > 0) {
                insights.improvement.push(`${current.active_auctions} active auctions - ensure timely bank participation`);
            }
            if (conversionRate < 30 && current.total_applications > 0) {
                insights.improvement.push(`Low lead conversion rate: ${conversionRate.toFixed(1)}% - focus on improving lead quality and bank engagement`);
            }
            if (current.total_applications === 0) {
                insights.improvement.push(`No applications in this period - focus on lead generation`);
            }
            if (current.total_applications > 0 && current.revenue_generating_applications === 0) {
                insights.improvement.push(`No leads sold despite ${current.total_applications} applications - review bank participation`);
            }

            return NextResponse.json({
                success: true,
                data: {
                    metrics: {
                        total_revenue: current.total_revenue || 0,
                        revenue_generating_applications: current.revenue_generating_applications || 0,
                        avg_revenue_per_application: current.avg_revenue_per_application || 0,
                        completed_applications: current.completed_applications || 0,
                        total_applications: current.total_applications || 0,
                        active_auctions: current.active_auctions || 0
                    },
                    changes: {
                        revenue_change: revenueChange,
                        apps_change: appsChange,
                        avg_revenue_change: avgRevenueChange,
                        completed_change: completedChange
                    },
                    daily_trend: data.daily_trend || [],
                    bank_performance: data.bank_performance || [],
                    insights: insights,
                    conversion_rate: conversionRate,
                    abandonment_rate: abandonmentRate,
                    time_range: timeRange,
                    period: {
                        start: currentStartDate,
                        end: currentEndDate
                    }
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Revenue analytics error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch revenue analytics' },
            { status: 500 }
        );
    }
});
