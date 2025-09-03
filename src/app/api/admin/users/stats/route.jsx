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

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_users_stats_route.jsx_route');
        
        try {
            // Get user statistics
            const userStatsQuery = `
                SELECT 
                    user_type,
                    COUNT(*) as count,
                    COUNT(CASE WHEN account_status = 'active' THEN 1 END) as active_count,
                    COUNT(CASE WHEN account_status = 'inactive' THEN 1 END) as inactive_count,
                    COUNT(CASE WHEN account_status = 'suspended' THEN 1 END) as suspended_count
                FROM users 
                WHERE user_type IN ('business_user', 'individual_user', 'bank_user', 'admin_user')
                GROUP BY user_type
                ORDER BY user_type
            `;
            
            const userStatsResult = await client.query(userStatsQuery);
            
            // Get registration trends
            const registrationTrendsQuery = `
                SELECT 
                    DATE_TRUNC('month', created_at) as month,
                    user_type,
                    COUNT(*) as count
                FROM users 
                WHERE user_type IN ('business_user', 'individual_user', 'bank_user')
                AND created_at >= NOW() - INTERVAL '12 months'
                GROUP BY DATE_TRUNC('month', created_at), user_type
                ORDER BY month DESC, user_type
            `;
            
            const registrationTrendsResult = await client.query(registrationTrendsQuery);
            
            // Get business user verification stats
            const businessVerificationQuery = `
                SELECT 
                    COUNT(*) as total_business_users,
                    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_count,
                    COUNT(CASE WHEN is_verified = false THEN 1 END) as unverified_count,
                    ROUND(
                        CASE 
                            WHEN COUNT(*) > 0 
                            THEN (COUNT(CASE WHEN is_verified = true THEN 1 END)::DECIMAL / COUNT(*)) * 100 
                            ELSE 0 
                        END, 2
                    ) as verification_rate
                FROM business_users
            `;
            
            const businessVerificationResult = await client.query(businessVerificationQuery);
            
            // Get bank user stats
            const bankUserQuery = `
                SELECT 
                    COUNT(*) as total_bank_users,
                    COUNT(CASE WHEN u.account_status = 'active' THEN 1 END) as active_banks,
                    COUNT(CASE WHEN u.account_status = 'inactive' THEN 1 END) as inactive_banks
                FROM users u
                WHERE u.user_type = 'bank_user'
            `;
            
            const bankUserResult = await client.query(bankUserQuery);
            
            return NextResponse.json({
                success: true,
                data: {
                    user_stats: userStatsResult.rows,
                    registration_trends: registrationTrendsResult.rows,
                    business_verification: businessVerificationResult.rows[0] || {},
                    bank_users: bankUserResult.rows[0] || {}
                }
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('User stats error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch user statistics' },
            { status: 500 }
        );
    }
}
