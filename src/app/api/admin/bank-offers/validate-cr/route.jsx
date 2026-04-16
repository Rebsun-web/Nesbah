import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

// GET - Validate CR number for bank offer creation
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

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_bank_offers_validate_cr_route.jsx_route');
        
        try {
            // Check if business user exists with this CR number
            const businessUserQuery = `
                SELECT
                    bu.user_id,
                    wd.cr_number,
                    bu.cr_national_number,
                    wd.trade_name,
                    wd.legal_form,
                    wd.registration_status,
                    wd.issue_date_gregorian,
                    wd.city,
                    wd.sector as activities,
                    wd.has_ecommerce,
                    wd.store_url,
                    wd.cr_capital,
                    wd.cash_capital,
                    wd.management_structure,
                    wd.management_managers,
                    bu.contact_person,
                    bu.contact_person_number,
                    u.email,
                    u.created_at
                FROM business_users bu
                JOIN users u ON bu.user_id = u.user_id
                LEFT JOIN wathiq_data wd ON bu.wathiq_data_id = wd.id
                WHERE wd.cr_number = $1
                AND wd.registration_status = 'active'
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

            // Check if this business user has any application (for bank offers, we allow offers for existing applications)
            const existingApplicationQuery = `
                SELECT
                    pa.application_id,
                    pa.status,
                    pa.current_application_status,
                    pa.auction_end_time,
                    pa.submitted_at,
                    wd2.trade_name,
                    wd2.city,
                    wd2.cr_capital,
                    pa.preferred_repayment_period_months,
                    wd2.legal_form,
                    wd2.registration_status,
                    pa.contact_person,
                    pa.contact_person_number
                FROM pos_application pa
                LEFT JOIN wathiq_data wd2 ON wd2.cr_national_number = pa.cr_national_number
                WHERE pa.user_id = $1
                AND pa.status IN ('live_auction', 'completed', 'ignored')
                ORDER BY pa.submitted_at DESC
                LIMIT 1
            `;
            
            const existingApplicationResult = await client.query(existingApplicationQuery, [businessUser.user_id]);
            const hasExistingApplication = existingApplicationResult.rows.length > 0;
            const application = hasExistingApplication ? existingApplicationResult.rows[0] : null;

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
                    hasApplication: hasExistingApplication,
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
                    },
                    application: application ? {
                        application_id: application.application_id,
                        status: application.status,
                        current_application_status: application.current_application_status,
                        auction_end_time: application.auction_end_time,
                        submitted_at: application.submitted_at,
                        trade_name: application.trade_name,
                        city: application.city,
                        cr_capital: application.cr_capital,
                        preferred_repayment_period_months: application.preferred_repayment_period_months,
                        legal_form: application.legal_form,
                        registration_status: application.registration_status,
                        contact_person: application.contact_person,
                        contact_person_number: application.contact_person_number
                    } : null
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
