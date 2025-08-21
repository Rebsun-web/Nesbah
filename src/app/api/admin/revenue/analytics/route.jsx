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
                    COALESCE(SUM(sa.revenue_collected), 0) as total_revenue,
                    COUNT(CASE WHEN sa.revenue_collected > 0 THEN 1 END) as revenue_generating_applications,
                    COALESCE(AVG(CASE WHEN sa.revenue_collected > 0 THEN sa.revenue_collected END), 0) as avg_revenue_per_application,
                    COUNT(CASE WHEN sa.status = 'completed' THEN 1 END) as completed_applications,
                    COUNT(CASE WHEN sa.status = 'abandoned' THEN 1 END) as abandoned_applications,
                    COUNT(CASE WHEN sa.status = 'deal_expired' THEN 1 END) as expired_applications,
                    COUNT(CASE WHEN sa.status = 'pending_offers' THEN 1 END) as active_auctions,
                    COUNT(CASE WHEN sa.status = 'offer_received' THEN 1 END) as active_selections,
                    COUNT(*) as total_applications
                FROM submitted_applications sa
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
                    COALESCE(SUM(sa.revenue_collected), 0) as total_revenue,
                    COUNT(CASE WHEN sa.revenue_collected > 0 THEN 1 END) as revenue_generating_applications,
                    COALESCE(AVG(CASE WHEN sa.revenue_collected > 0 THEN sa.revenue_collected END), 0) as avg_revenue_per_application,
                    COUNT(CASE WHEN sa.status = 'completed' THEN 1 END) as completed_applications,
                    COUNT(*) as total_applications
                FROM submitted_applications sa
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
                    COALESCE(SUM(sa.revenue_collected), 0) as revenue,
                    COUNT(*) as applications,
                    COUNT(CASE WHEN sa.revenue_collected > 0 THEN 1 END) as revenue_apps
                FROM submitted_applications sa
                ${dateFilter}
                GROUP BY DATE(sa.submitted_at)
                ORDER BY date ASC
            `;

            const dailyTrend = await client.query(dailyTrendQuery, dateParams);

            // Get bank performance data (using bank_user_id for now)
            const bankPerformanceQuery = `
                SELECT 
                    'Bank ' || ar.bank_user_id as bank_name,
                    COALESCE(SUM(ar.amount), 0) as revenue,
                    COUNT(DISTINCT sa.id) as applications,
                    COUNT(CASE WHEN sa.status = 'completed' THEN 1 END) as completed_applications,
                    CASE 
                        WHEN COUNT(DISTINCT sa.id) > 0 THEN 
                            ROUND((COUNT(CASE WHEN sa.status = 'completed' THEN 1 END)::DECIMAL / COUNT(DISTINCT sa.id)) * 100, 1)
                        ELSE 0 
                    END as success_rate
                FROM application_revenue ar
                JOIN submitted_applications sa ON ar.application_id = sa.id
                ${dateFilter}
                GROUP BY ar.bank_user_id
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

            if (revenueChange > 0) {
                insights.positive.push(`Revenue increased ${revenueChange.toFixed(1)}% this period`);
            }
            if (conversionRate > 70) {
                insights.positive.push(`Conversion rate is strong at ${conversionRate.toFixed(1)}%`);
            }
            if (current.avg_revenue_per_application > 20) {
                insights.positive.push(`Average deal value is healthy at SAR ${current.avg_revenue_per_application.toFixed(2)}`);
            }

            if (abandonmentRate > 10) {
                insights.improvement.push(`${abandonmentRate.toFixed(1)}% of applications abandoned`);
            }
            if (expirationRate > 5) {
                insights.improvement.push(`${expirationRate.toFixed(1)}% of deals expired`);
            }
            if (current.active_auctions > 0) {
                insights.improvement.push(`${current.active_auctions} active auctions need attention`);
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
