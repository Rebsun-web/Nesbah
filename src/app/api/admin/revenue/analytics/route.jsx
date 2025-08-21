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
        const timeRange = searchParams.get('timeRange') || '7d';
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const client = await pool.connect();
        
        try {
            // Calculate date range based on timeRange parameter
            let dateFilter = '';
            let dateParams = [];
            let paramCount = 0;

            if (startDate && endDate) {
                paramCount += 2;
                dateFilter = `WHERE sa.submitted_at >= $${paramCount - 1} AND sa.submitted_at <= $${paramCount}`;
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
                
                paramCount += 1;
                dateFilter = `WHERE sa.submitted_at >= $${paramCount}`;
                dateParams = [startDate.toISOString()];
            }

            // Get current period revenue metrics
            const currentRevenueQuery = `
                SELECT 
                    COUNT(DISTINCT CASE WHEN sa.has_been_purchased = TRUE THEN sa.application_id END) * 25 as total_revenue,
                    COUNT(DISTINCT CASE WHEN sa.has_been_purchased = TRUE THEN sa.application_id END) as revenue_generating_applications,
                    25 as avg_revenue_per_application,
                    COUNT(DISTINCT CASE WHEN COALESCE(aot.current_application_status, sa.status) = 'completed' THEN sa.application_id END) as completed_applications,
                    COUNT(DISTINCT CASE WHEN COALESCE(aot.current_application_status, sa.status) = 'abandoned' THEN sa.application_id END) as abandoned_applications,
                    COUNT(DISTINCT CASE WHEN COALESCE(aot.current_application_status, sa.status) = 'deal_expired' THEN sa.application_id END) as expired_applications,
                    COUNT(DISTINCT CASE WHEN COALESCE(aot.current_application_status, sa.status) = 'pending_offers' THEN sa.application_id END) as active_auctions,
                    COUNT(DISTINCT CASE WHEN COALESCE(aot.current_application_status, sa.status) = 'offer_received' THEN sa.application_id END) as active_selections,
                    COUNT(DISTINCT sa.application_id) as total_applications
                FROM submitted_applications sa
                LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
                ${dateFilter}
            `;

            const currentRevenue = await client.query(currentRevenueQuery, dateParams);

            // Calculate previous period for comparison
            const currentStartDate = dateParams[0];
            const currentEndDate = dateParams[1] || new Date().toISOString();
            
            const currentStart = new Date(currentStartDate);
            const currentEnd = new Date(currentEndDate);
            const periodDuration = currentEnd.getTime() - currentStart.getTime();
            
            const previousStart = new Date(currentStart.getTime() - periodDuration);
            const previousEnd = new Date(currentStart.getTime());

            const previousRevenueQuery = `
                SELECT 
                    COUNT(DISTINCT CASE WHEN sa.has_been_purchased = TRUE THEN sa.application_id END) * 25 as total_revenue,
                    COUNT(DISTINCT CASE WHEN sa.has_been_purchased = TRUE THEN sa.application_id END) as revenue_generating_applications,
                    25 as avg_revenue_per_application,
                    COUNT(DISTINCT CASE WHEN COALESCE(aot.current_application_status, sa.status) = 'completed' THEN sa.application_id END) as completed_applications,
                    COUNT(DISTINCT sa.application_id) as total_applications
                FROM submitted_applications sa
                LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
                WHERE sa.submitted_at >= $1 AND sa.submitted_at < $2
            `;

            const previousRevenue = await client.query(previousRevenueQuery, [previousStart.toISOString(), previousEnd.toISOString()]);

            // Calculate percentage changes
            const current = currentRevenue.rows[0];
            const previous = previousRevenue.rows[0];

            const calculateChange = (current, previous) => {
                if (previous === 0) return current > 0 ? 100 : 0;
                return ((current - previous) / previous) * 100;
            };

            // Convert string values to numbers for calculations
            const currentNum = {
                total_revenue: Number(current.total_revenue) || 0,
                revenue_generating_applications: Number(current.revenue_generating_applications) || 0,
                avg_revenue_per_application: Number(current.avg_revenue_per_application) || 0,
                completed_applications: Number(current.completed_applications) || 0
            };

            const previousNum = {
                total_revenue: Number(previous.total_revenue) || 0,
                revenue_generating_applications: Number(previous.revenue_generating_applications) || 0,
                avg_revenue_per_application: Number(previous.avg_revenue_per_application) || 0,
                completed_applications: Number(previous.completed_applications) || 0
            };

            const revenueChange = calculateChange(currentNum.total_revenue, previousNum.total_revenue);
            const appsChange = calculateChange(currentNum.revenue_generating_applications, previousNum.revenue_generating_applications);
            const avgRevenueChange = calculateChange(currentNum.avg_revenue_per_application, previousNum.avg_revenue_per_application);
            const completedChange = calculateChange(currentNum.completed_applications, previousNum.completed_applications);

            // Get daily revenue trend data
            const dailyTrendQuery = `
                SELECT 
                    DATE(sa.submitted_at) as date,
                    COUNT(DISTINCT CASE WHEN sa.has_been_purchased = TRUE THEN sa.application_id END) * 25 as revenue,
                    COUNT(DISTINCT CASE WHEN sa.has_been_purchased = TRUE THEN sa.application_id END) as applications,
                    COUNT(DISTINCT CASE WHEN sa.has_been_purchased = TRUE THEN sa.application_id END) as revenue_apps
                FROM submitted_applications sa
                ${dateFilter}
                GROUP BY DATE(sa.submitted_at)
                ORDER BY date ASC
            `;

            const dailyTrend = await client.query(dailyTrendQuery, dateParams);

            // Get bank performance data from application offers
            const bankPerformanceQuery = `
                SELECT 
                    COALESCE(u.email, 'Unknown Bank') as bank_name,
                    COUNT(DISTINCT sa.application_id) * 25 as revenue,
                    COUNT(DISTINCT sa.application_id) as applications,
                    COUNT(CASE WHEN COALESCE(aot.current_application_status, sa.status) = 'completed' THEN 1 END) as completed_applications,
                    CASE 
                        WHEN COUNT(DISTINCT sa.application_id) > 0 THEN 
                            ROUND((COUNT(CASE WHEN COALESCE(aot.current_application_status, sa.status) = 'completed' THEN 1 END)::DECIMAL / COUNT(DISTINCT sa.application_id)) * 100, 1)
                        ELSE 0 
                    END as success_rate
                FROM application_offers ao
                JOIN submitted_applications sa ON ao.submitted_application_id = sa.application_id
                LEFT JOIN users u ON ao.submitted_by_user_id = u.user_id
                LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
                WHERE u.user_type = 'bank_user'
                ${dateFilter.replace('WHERE', 'AND')}
                GROUP BY u.email, u.user_id
                ORDER BY revenue DESC
                LIMIT 10
            `;

            const bankPerformance = await client.query(bankPerformanceQuery, dateParams);

            // Get revenue insights
            const conversionRate = current.total_applications > 0 ? 
                (current.completed_applications / current.total_applications) * 100 : 0;
            
            const abandonmentRate = current.total_applications > 0 ? 
                (current.abandoned_applications / current.total_applications) * 100 : 0;
            
            const expirationRate = current.total_applications > 0 ? 
                (current.expired_applications / current.total_applications) * 100 : 0;

            // Generate insights based on data
            const insights = {
                positive: [],
                improvement: []
            };

            // Positive trends - more comprehensive analysis
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
            if (current.active_selections > 0) {
                insights.positive.push(`${current.active_selections} applications have active offer selections`);
            }
            if (current.total_revenue > 0) {
                insights.positive.push(`Total lead sales: ${current.total_revenue / 25} leads sold`);
            }

            // Areas for improvement - more actionable insights
            if (abandonmentRate > 15) {
                insights.improvement.push(`High abandonment rate: ${abandonmentRate.toFixed(1)}% - consider improving application process`);
            } else if (abandonmentRate > 5) {
                insights.improvement.push(`Moderate abandonment rate: ${abandonmentRate.toFixed(1)}% - monitor application flow`);
            }
            if (expirationRate > 10) {
                insights.improvement.push(`High expiration rate: ${expirationRate.toFixed(1)}% - review auction deadlines`);
            } else if (expirationRate > 3) {
                insights.improvement.push(`Moderate expiration rate: ${expirationRate.toFixed(1)}% - optimize timing`);
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
                        total_revenue: currentNum.total_revenue,
                        revenue_generating_applications: currentNum.revenue_generating_applications,
                        avg_revenue_per_application: currentNum.avg_revenue_per_application,
                        completed_applications: currentNum.completed_applications,
                        total_applications: Number(current.total_applications) || 0,
                        active_auctions: Number(current.active_auctions) || 0,
                        active_selections: Number(current.active_selections) || 0
                    },
                    changes: {
                        revenue_change: revenueChange,
                        apps_change: appsChange,
                        avg_revenue_change: avgRevenueChange,
                        completed_change: completedChange
                    },
                    daily_trend: dailyTrend.rows,
                    bank_performance: bankPerformance.rows,
                    insights: insights,
                    conversion_rate: conversionRate,
                    abandonment_rate: abandonmentRate,
                    expiration_rate: expirationRate,
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
}
