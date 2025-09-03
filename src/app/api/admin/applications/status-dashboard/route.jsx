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

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_applications_status-dashboard_route.jsx_route');
        
        try {
            // Get status counts for the 3 main statuses only
            const statusCountsQuery = `
                WITH all_possible_statuses AS (
                    SELECT unnest(ARRAY['live_auction', 'completed', 'ignored']) as status
                ),
                actual_status_counts AS (
                    SELECT 
                        COALESCE(pa.current_application_status, pa.status) as status,
                        COUNT(DISTINCT pa.application_id) as count
                    FROM pos_application pa
                    WHERE COALESCE(pa.current_application_status, pa.status) IN ('live_auction', 'completed', 'ignored')
                    GROUP BY COALESCE(pa.current_application_status, pa.status)
                )
                SELECT 
                    aps.status,
                    COALESCE(actual_counts.count, 0) as count
                FROM all_possible_statuses aps
                LEFT JOIN actual_status_counts actual_counts ON aps.status = actual_counts.status
                ORDER BY 
                    CASE aps.status
                        WHEN 'live_auction' THEN 1
                        WHEN 'completed' THEN 2
                        WHEN 'ignored' THEN 3
                        ELSE 4
                    END
            `;
            
            const statusCountsResult = await client.query(statusCountsQuery);
            
            // Get recent applications (simplified without auction timing)
            const recentApplicationsQuery = `
                SELECT 
                    pa.application_id,
                    COALESCE(pa.current_application_status, pa.status) as status,
                    pa.submitted_at,
                    pa.trade_name,
                    pa.offers_count,
                    pa.revenue_collected
                FROM pos_application pa
                WHERE COALESCE(pa.current_application_status, pa.status) IN ('live_auction', 'completed', 'ignored')
                ORDER BY pa.submitted_at DESC
                LIMIT 20
            `;
            
            const recentApplicationsResult = await client.query(recentApplicationsQuery);
            
            // Calculate totals
            const totalApplications = statusCountsResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
            
            return NextResponse.json({
                success: true,
                data: {
                    statusCounts: statusCountsResult.rows,
                    recentApplications: recentApplicationsResult.rows,
                    totals: {
                        totalApplications
                    }
                }
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Status dashboard error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch status dashboard data' },
            { status: 500 }
        );
    }
}
