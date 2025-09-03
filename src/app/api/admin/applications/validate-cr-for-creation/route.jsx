import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

// GET - Validate CR number for application creation
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

        const { searchParams } = new URL(req.url);
        const crNumber = searchParams.get('cr_number');
        
        if (!crNumber) {
            return NextResponse.json({ success: false, error: 'CR number is required' }, { status: 400 });
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_applications_validate_cr_for_creation_route.jsx_route');
        
        try {
            // Check if business user exists with this CR number
            const businessUserQuery = `
                SELECT 
                    bu.user_id,
                    bu.cr_number,
                    bu.cr_national_number,
                    bu.trade_name,
                    bu.legal_form,
                    bu.registration_status,
                    bu.issue_date_gregorian,
                    bu.city,
                    bu.address,
                    bu.sector as activities,
                    bu.has_ecommerce,
                    bu.store_url,
                    bu.cr_capital,
                    bu.cash_capital,
                    bu.management_structure,
                    bu.management_managers,
                    bu.contact_person,
                    bu.contact_person_number,
                    u.email,
                    u.created_at
                FROM business_users bu
                JOIN users u ON bu.user_id = u.user_id
                WHERE bu.cr_number = $1
                AND bu.registration_status = 'active'
            `;
            
            const businessUserResult = await client.query(businessUserQuery, [crNumber]);
            
            if (businessUserResult.rows.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: 'Business user not found with this CR number',
                    data: {
                        exists: false,
                        hasApplication: false,
                        businessUser: null
                    }
                });
            }

            const businessUser = businessUserResult.rows[0];

            // Check if this business user already has a submitted application
            const existingApplicationQuery = `
                SELECT COUNT(*) as count
                FROM pos_application 
                WHERE user_id = $1 
                AND status IN ('submitted', 'live_auction', 'pending_offers')
            `;
            
            const existingApplicationResult = await client.query(existingApplicationQuery, [businessUser.user_id]);
            const hasExistingApplication = parseInt(existingApplicationResult.rows[0].count) > 0;

            if (hasExistingApplication) {
                return NextResponse.json({
                    success: false,
                    error: 'Business user already has a submitted application',
                    data: {
                        exists: true,
                        hasApplication: true,
                        businessUser: null
                    }
                });
            }

            // Parse contact_info if it's stored as JSON
            let contactInfo = {};
            if (businessUser.contact_person_number) {
                contactInfo.phone = businessUser.contact_person_number;
            }
            if (businessUser.email) {
                contactInfo.email = businessUser.email;
            }

            return NextResponse.json({
                success: true,
                message: 'CR number validated successfully',
                data: {
                    exists: true,
                    hasApplication: false,
                    businessUser: {
                        user_id: businessUser.user_id,
                        cr_number: businessUser.cr_number,
                        cr_national_number: businessUser.cr_national_number,
                        trade_name: businessUser.trade_name,
                        legal_form: businessUser.legal_form,
                        registration_status: businessUser.registration_status,
                        issue_date: businessUser.issue_date_gregorian,
                        city: businessUser.city,
                        address: businessUser.address,
                        activities: businessUser.activities,
                        has_ecommerce: businessUser.has_ecommerce,
                        store_url: businessUser.store_url,
                        cr_capital: businessUser.cr_capital,
                        cash_capital: businessUser.cash_capital,
                        management_structure: businessUser.management_structure,
                        management_managers: businessUser.management_managers,
                        contact_person: businessUser.contact_person,
                        contact_person_number: businessUser.contact_person_number,
                        email: businessUser.email,
                        created_at: businessUser.created_at,
                        contact_info: contactInfo
                    }
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('CR validation error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to validate CR number' },
            { status: 500 }
        );
    }
}
