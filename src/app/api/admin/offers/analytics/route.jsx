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

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_offers_analytics_route.jsx_route');
        
        try {
            // Get offer statistics
            const offerStatsQuery = `
                SELECT 
                    status,
                    COUNT(*) as count,
                    AVG(approved_financing_amount) as avg_amount,
                    SUM(approved_financing_amount) as total_amount
                FROM application_offers 
                GROUP BY status
                ORDER BY status
            `;
            
            const offerStatsResult = await client.query(offerStatsQuery);
            
            // Get monthly offer trends
            const monthlyTrendsQuery = `
                SELECT 
                    DATE_TRUNC('month', submitted_at) as month,
                    COUNT(*) as total_offers,
                    COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_offers,
                    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_offers,
                    COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_offers,
                    AVG(approved_financing_amount) as avg_amount,
                    SUM(approved_financing_amount) as total_amount
                FROM application_offers 
                WHERE submitted_at >= NOW() - INTERVAL '12 months'
                GROUP BY DATE_TRUNC('month', submitted_at)
                ORDER BY month DESC
            `;
            
            const monthlyTrendsResult = await client.query(monthlyTrendsQuery);
            
            // Get bank performance
            const bankPerformanceQuery = `
                SELECT 
                    u.entity_name as bank_name,
                    COUNT(ao.offer_id) as total_offers,
                    COUNT(CASE WHEN ao.status = 'accepted' THEN 1 END) as accepted_offers,
                    ROUND(
                        CASE 
                            WHEN COUNT(ao.offer_id) > 0 
                            THEN (COUNT(CASE WHEN ao.status = 'accepted' THEN 1 END)::DECIMAL / COUNT(ao.offer_id)) * 100 
                            ELSE 0 
                        END, 2
                    ) as acceptance_rate,
                    AVG(ao.approved_financing_amount) as avg_amount,
                    SUM(ao.approved_financing_amount) as total_amount
                FROM application_offers ao
                JOIN users u ON ao.bank_user_id = u.user_id
                WHERE u.user_type = 'bank_user'
                GROUP BY u.entity_name, u.user_id
                ORDER BY total_offers DESC
                LIMIT 10
            `;
            
            const bankPerformanceResult = await client.query(bankPerformanceQuery);
            
            // Get sector performance
            const sectorPerformanceQuery = `
                SELECT 
                    pa.sector,
                    COUNT(ao.offer_id) as total_offers,
                    AVG(ao.approved_financing_amount) as avg_amount,
                    SUM(ao.approved_financing_amount) as total_amount,
                    COUNT(CASE WHEN ao.status = 'accepted' THEN 1 END) as accepted_offers
                FROM application_offers ao
                JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
                GROUP BY pa.sector
                ORDER BY total_offers DESC
                LIMIT 10
            `;
            
            const sectorPerformanceResult = await client.query(sectorPerformanceQuery);
            
            // Calculate summary statistics
            const totalOffers = offerStatsResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
            const totalAmount = offerStatsResult.rows.reduce((sum, row) => sum + parseFloat(row.total_amount || 0), 0);
            const avgAmount = totalOffers > 0 ? totalAmount / totalOffers : 0;
            
            return NextResponse.json({
                success: true,
                data: {
                    summary: {
                        total_offers: totalOffers,
                        total_amount: totalAmount,
                        avg_amount: avgAmount
                    },
                    offer_stats: offerStatsResult.rows,
                    monthly_trends: monthlyTrendsResult.rows,
                    bank_performance: bankPerformanceResult.rows,
                    sector_performance: sectorPerformanceResult.rows
                }
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Offers analytics error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch offers analytics' },
            { status: 500 }
        );
    }
}
