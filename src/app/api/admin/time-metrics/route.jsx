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

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_time_metrics_route.jsx_route');
        
        try {
            // Get time-based metrics for applications
            const timeMetricsQuery = `
                SELECT 
                    'avg_processing_time' as metric_name,
                    ROUND(AVG(EXTRACT(EPOCH FROM (auction_end_time - submitted_at)) / 3600), 2) as value,
                    'hours' as unit
                FROM pos_application 
                WHERE status IN ('completed', 'ignored')
                AND auction_end_time IS NOT NULL
                AND submitted_at IS NOT NULL
                
                UNION ALL
                
                SELECT 
                    'avg_response_time' as metric_name,
                    ROUND(AVG(EXTRACT(EPOCH FROM (ao.submitted_at - pa.submitted_at)) / 3600), 2) as value,
                    'hours' as unit
                FROM application_offers ao
                JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
                WHERE ao.submitted_at IS NOT NULL
                AND pa.submitted_at IS NOT NULL
                
                UNION ALL
                
                SELECT 
                    'avg_auction_duration' as metric_name,
                    ROUND(AVG(EXTRACT(EPOCH FROM (auction_end_time - submitted_at)) / 3600), 2) as value,
                    'hours' as unit
                FROM pos_application 
                WHERE auction_end_time IS NOT NULL
                AND submitted_at IS NOT NULL
            `;
            
            const timeMetricsResult = await client.query(timeMetricsQuery);
            
            // Get daily application submission trends
            const dailyTrendsQuery = `
                SELECT 
                    DATE_TRUNC('day', submitted_at) as date,
                    COUNT(*) as applications_count,
                    COUNT(CASE WHEN status = 'live_auction' THEN 1 END) as live_auctions,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                    COUNT(CASE WHEN status = 'ignored' THEN 1 END) as ignored
                FROM pos_application 
                WHERE submitted_at >= NOW() - INTERVAL '30 days'
                GROUP BY DATE_TRUNC('day', submitted_at)
                ORDER BY date DESC
            `;
            
            const dailyTrendsResult = await client.query(dailyTrendsQuery);
            
            // Get hourly submission patterns
            const hourlyPatternsQuery = `
                SELECT 
                    EXTRACT(HOUR FROM submitted_at) as hour,
                    COUNT(*) as applications_count
                FROM pos_application 
                WHERE submitted_at >= NOW() - INTERVAL '30 days'
                GROUP BY EXTRACT(HOUR FROM submitted_at)
                ORDER BY hour
            `;
            
            const hourlyPatternsResult = await client.query(hourlyPatternsQuery);
            
            return NextResponse.json({
                success: true,
                data: {
                    time_metrics: timeMetricsResult.rows,
                    daily_trends: dailyTrendsResult.rows,
                    hourly_patterns: hourlyPatternsResult.rows
                }
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Time metrics error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch time metrics' },
            { status: 500 }
        );
    }
}

export async function POST(req) {
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

        const body = await req.json();
        const { timeRange, metricType } = body;

        if (!timeRange || !metricType) {
            return NextResponse.json(
                { success: false, error: 'timeRange and metricType are required' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_time_metrics_route.jsx_POST');
        
        try {
            let query;
            let params = [];

            switch (metricType) {
                case 'processing_time':
                    query = `
                        SELECT 
                            DATE_TRUNC('day', submitted_at) as date,
                            ROUND(AVG(EXTRACT(EPOCH FROM (auction_end_time - submitted_at)) / 3600), 2) as avg_hours
                        FROM pos_application 
                        WHERE submitted_at >= NOW() - INTERVAL $1
                        AND auction_end_time IS NOT NULL
                        GROUP BY DATE_TRUNC('day', submitted_at)
                        ORDER BY date DESC
                    `;
                    params = [timeRange];
                    break;
                    
                case 'response_time':
                    query = `
                        SELECT 
                            DATE_TRUNC('day', pa.submitted_at) as date,
                            ROUND(AVG(EXTRACT(EPOCH FROM (ao.submitted_at - pa.submitted_at)) / 3600), 2) as avg_hours
                        FROM pos_application pa
                        JOIN application_offers ao ON pa.application_id = ao.submitted_application_id
                        WHERE pa.submitted_at >= NOW() - INTERVAL $1
                        GROUP BY DATE_TRUNC('day', pa.submitted_at)
                        ORDER BY date DESC
                    `;
                    params = [timeRange];
                    break;
                    
                default:
                    return NextResponse.json(
                        { success: false, error: 'Invalid metric type' },
                        { status: 400 }
                    );
            }
            
            const result = await client.query(query, params);
            
            return NextResponse.json({
                success: true,
                data: {
                    metric_type: metricType,
                    time_range: timeRange,
                    metrics: result.rows
                }
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Time metrics POST error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch time metrics' },
            { status: 500 }
        );
    }
}
