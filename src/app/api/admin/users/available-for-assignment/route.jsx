import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
    try {
        const client = await pool.connect();
        
        try {
            console.log('🔍 Starting available-for-assignment query...');
            
            // First, let's debug what applications exist for the problematic business
            const debugQuery = `
                SELECT 
                    sa.application_id,
                    sa.assigned_user_id,
                    sa.business_user_id,
                    bu.trade_name,
                    bu.user_id,
                    u.email
                FROM submitted_applications sa
                LEFT JOIN business_users bu ON sa.business_user_id = bu.user_id
                LEFT JOIN users u ON bu.user_id = u.user_id
                WHERE bu.trade_name LIKE '%Agricultural Development%'
                   OR u.email LIKE '%cr012@nesbah.com%'
                   OR sa.business_user_id IN (
                       SELECT user_id FROM business_users WHERE trade_name LIKE '%Agricultural Development%'
                   )
                ORDER BY sa.application_id DESC
            `;
            
            const debugResult = await client.query(debugQuery);
            console.log('🔍 Debug - Applications for Agricultural Development Co.:', debugResult.rows);
            
            // Get business users who haven't been assigned to any applications yet
            // Only include users whose type is 'business_user'
            // Filter out duplicates and businesses with existing applications
            // Filter out businesses if ANY business with same name/email has applications
            const query = `
                SELECT DISTINCT ON (bu.trade_name, u.email)
                    bu.user_id,
                    bu.trade_name as entity_name,
                    bu.cr_national_number,
                    bu.cr_number,
                    bu.registration_status,
                    bu.address,
                    bu.sector,
                    bu.city,
                    bu.cr_capital,
                    bu.cash_capital,
                    bu.in_kind_capital,
                    bu.contact_person,
                    bu.contact_person_number,
                    bu.contact_info,
                    bu.store_url,
                    bu.form_name,
                    bu.issue_date_gregorian,
                    bu.confirmation_date_gregorian,
                    bu.has_ecommerce,
                    bu.management_structure,
                    bu.management_managers,
                    u.created_at,
                    u.updated_at,
                    u.email
                FROM business_users bu
                JOIN users u ON bu.user_id = u.user_id
                WHERE NOT EXISTS (
                    SELECT 1 FROM submitted_applications sa 
                    WHERE sa.assigned_user_id = bu.user_id
                       OR sa.business_user_id = bu.user_id
                )
                AND NOT EXISTS (
                    SELECT 1 FROM submitted_applications sa2
                    JOIN business_users bu2 ON sa2.business_user_id = bu2.user_id
                    JOIN users u2 ON bu2.user_id = u2.user_id
                    WHERE (bu2.trade_name = bu.trade_name OR u2.email = u.email)
                      AND (sa2.assigned_user_id IS NOT NULL OR sa2.business_user_id IS NOT NULL)
                )
                AND bu.registration_status = 'active'
                AND u.user_type = 'business_user'
                ORDER BY bu.trade_name, u.email, bu.user_id ASC
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
                        bu.trade_name,
                        u.email,
                        u.user_type,
                        bu.registration_status,
                        EXISTS (
                            SELECT 1 FROM submitted_applications sa 
                            WHERE sa.assigned_user_id = bu.user_id
                        ) as has_assigned_apps,
                        EXISTS (
                            SELECT 1 FROM submitted_applications sa 
                            WHERE sa.business_user_id = bu.user_id
                        ) as has_business_apps,
                        EXISTS (
                            SELECT 1 FROM submitted_applications sa2
                            JOIN business_users bu2 ON sa2.business_user_id = bu2.user_id
                            JOIN users u2 ON bu2.user_id = u2.user_id
                            WHERE (bu2.trade_name = bu.trade_name OR u2.email = u.email)
                              AND (sa2.assigned_user_id IS NOT NULL OR sa2.business_user_id IS NOT NULL)
                        ) as has_related_apps
                    FROM business_users bu
                    JOIN users u ON bu.user_id = u.user_id
                    WHERE bu.trade_name LIKE '%Agricultural Development%'
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
