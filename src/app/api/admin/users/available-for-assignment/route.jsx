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

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_users_available-for-assignment_route.jsx_route');
        
        try {
            console.log('🔍 Starting available-for-assignment query...');
            
            // First, let's debug what applications exist for the problematic business
            const debugQuery = `
                SELECT
                    pa.application_id,
                    pa.business_user_id,
                    wd.trade_name,
                    bu.user_id,
                    u.email
                FROM pos_application pa
                LEFT JOIN business_users bu ON pa.business_user_id = bu.user_id
                LEFT JOIN wathiq_data wd ON bu.wathiq_data_id = wd.id
                LEFT JOIN users u ON bu.user_id = u.user_id
                WHERE wd.trade_name LIKE '%Agricultural Development%'
                   OR u.email LIKE '%cr012@nesbah.com%'
                   OR pa.business_user_id IN (
                       SELECT bu2.user_id FROM business_users bu2
                       LEFT JOIN wathiq_data wd2 ON bu2.wathiq_data_id = wd2.id
                       WHERE wd2.trade_name LIKE '%Agricultural Development%'
                   )
                ORDER BY pa.application_id DESC
            `;
            
            const debugResult = await client.query(debugQuery);
            console.log('🔍 Debug - Applications for Agricultural Development Co.:', debugResult.rows);
            
            // Get business users who haven't been assigned to any applications yet
            // Only include users whose type is 'business_user'
            // Filter out duplicates and businesses with existing applications
            // Filter out businesses if ANY business with same name/email has applications
            const query = `
                SELECT DISTINCT ON (wd.trade_name, u.email)
                    bu.user_id,
                    wd.trade_name as entity_name,
                    bu.cr_national_number,
                    wd.cr_number,
                    wd.registration_status,
                    wd.sector,
                    wd.city,
                    wd.cr_capital,
                    wd.cash_capital,
                    wd.in_kind_capital,
                    bu.contact_person,
                    bu.contact_person_number,
                    wd.contact_info,
                    wd.store_url,
                    wd.legal_form,
                    wd.issue_date_gregorian,
                    wd.confirmation_date_gregorian,
                    wd.has_ecommerce,
                    wd.management_structure,
                    wd.management_managers,
                    u.created_at,
                    u.updated_at,
                    u.email
                FROM business_users bu
                JOIN users u ON bu.user_id = u.user_id
                LEFT JOIN wathiq_data wd ON bu.wathiq_data_id = wd.id
                WHERE NOT EXISTS (
                    SELECT 1 FROM pos_application pa
                    WHERE pa.business_user_id = bu.user_id
                )
                AND NOT EXISTS (
                    SELECT 1 FROM pos_application pa2
                    JOIN business_users bu2 ON pa2.business_user_id = bu2.user_id
                    LEFT JOIN wathiq_data wd2 ON bu2.wathiq_data_id = wd2.id
                    JOIN users u2 ON bu2.user_id = u2.user_id
                    WHERE (wd2.trade_name = wd.trade_name OR u2.email = u.email)
                      AND pa2.business_user_id IS NOT NULL
                )
                AND wd.registration_status = 'active'
                AND u.user_type = 'business_user'
                ORDER BY wd.trade_name, u.email, bu.user_id ASC
            `;
            
            console.log('🔍 Executing main query...');
            const result = await client.query(query);
            console.log('🔍 Main query result count:', result.rows.length);
            
            // Debug: Check if Agricultural Development Co. is in the results
            const agriculturalDev = result.rows.filter(row => 
                row.entity_name.includes('Agricultural Development') || 
                row.email === 'cr012@nesbah.com'
            );
            
            if (agriculturalDev.length > 0) {
                console.log('❌ PROBLEM: Agricultural Development Co. found in results:', agriculturalDev);
                
                // Let's check why it wasn't filtered out
                const whyNotFilteredQuery = `
                    SELECT
                        bu.user_id,
                        wd.trade_name,
                        u.email,
                        u.user_type,
                        wd.registration_status,
                        EXISTS (
                            SELECT 1 FROM pos_application pa
                            WHERE pa.business_user_id = bu.user_id
                        ) as has_business_apps,
                        EXISTS (
                            SELECT 1 FROM pos_application pa2
                            JOIN business_users bu2 ON pa2.business_user_id = bu2.user_id
                            LEFT JOIN wathiq_data wd2 ON bu2.wathiq_data_id = wd2.id
                            JOIN users u2 ON bu2.user_id = u2.user_id
                            WHERE (wd2.trade_name = wd.trade_name OR u2.email = u.email)
                              AND pa2.business_user_id IS NOT NULL
                        ) as has_related_apps
                    FROM business_users bu
                    JOIN users u ON bu.user_id = u.user_id
                    LEFT JOIN wathiq_data wd ON bu.wathiq_data_id = wd.id
                    WHERE wd.trade_name LIKE '%Agricultural Development%'
                       OR u.email = 'cr012@nesbah.com'
                `;
                
                const whyNotFilteredResult = await client.query(whyNotFilteredQuery);
                console.log('🔍 Why not filtered out:', whyNotFilteredResult.rows);
            } else {
                console.log('✅ Agricultural Development Co. properly filtered out');
            }
            
            // Debug: Show all results for verification
            console.log('🔍 All available users:', result.rows.map(row => ({
                user_id: row.user_id,
                trade_name: row.entity_name,
                email: row.email
            })));
            
            return NextResponse.json({
                success: true,
                data: {
                    users: result.rows,
                    total: result.rows.length
                }
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Get available users for assignment error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch available users' },
            { status: 500 }
        );
    }
}
