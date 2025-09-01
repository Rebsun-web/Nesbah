import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateAPIRequest } from '@/lib/auth/api-auth';

export async function GET(req, { params }) {
    try {
        const { id } = params;
        const applicationId = parseInt(id);

        if (isNaN(applicationId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid application ID' },
                { status: 400 }
            );
        }

        // Authenticate the request
        const authResult = await authenticateAPIRequest(req);
        if (!authResult.success) {
            return NextResponse.json(
                { success: false, error: authResult.error },
                { status: 401 }
            );
        }

        // Only bank users can access unmasked contact information
        if (authResult.user.user_type !== 'bank_user' && authResult.user.user_type !== 'bank_employee') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized access' },
                { status: 403 }
            );
        }

        // Determine the effective bank user ID
        let bankUserId = authResult.user.user_id;
        if (authResult.user.user_type === 'bank_employee') {
            try {
                const bankEmployeeResult = await pool.query(
                    'SELECT bank_user_id FROM bank_employees WHERE user_id = $1',
                    [authResult.user.user_id]
                );
                if (bankEmployeeResult.rows.length > 0) {
                    bankUserId = bankEmployeeResult.rows[0].bank_user_id;
                }
            } catch (error) {
                console.error('Error getting bank user ID for employee:', error);
                return NextResponse.json({ success: false, error: 'Failed to get bank information' }, { status: 500 });
            }
        }

        // Check if the bank has submitted an offer for this application
        const offerCheck = await pool.query(
            `SELECT COUNT(*) as offer_count 
             FROM application_offers 
             WHERE submitted_application_id = $1 AND bank_user_id = $2`,
            [applicationId, bankUserId]
        );

        if (parseInt(offerCheck.rows[0].offer_count) === 0) {
            return NextResponse.json(
                { success: false, error: 'No offer submitted for this application' },
                { status: 403 }
            );
        }

        // Fetch the unmasked contact information
        const result = await pool.query(
            `SELECT 
                pa.contact_person,
                pa.contact_person_number,
                pa.pos_provider_name,
                pa.pos_age_duration_months,
                pa.avg_monthly_pos_sales,
                pa.requested_financing_amount,
                pa.preferred_repayment_period_months,
                bu.contact_info,
                bu.address,
                bu.city,
                bu.sector,
                bu.activities
             FROM pos_application pa
             JOIN business_users bu ON pa.user_id = bu.user_id
             WHERE pa.application_id = $1`,
            [applicationId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Application not found' },
                { status: 404 }
            );
        }

        const application = result.rows[0];
        
        // Extract email from contact_info JSONB
        let email = null;
        if (application.contact_info && typeof application.contact_info === 'object') {
            email = application.contact_info.email;
        }

        // Extract website from contact_info JSONB
        let website = null;
        if (application.contact_info && typeof application.contact_info === 'object') {
            website = application.contact_info.website;
        }

        const unmaskedContactInfo = {
            contact_person: application.contact_person,
            contact_person_number: application.contact_person_number,
            email: email,
            website: website,
            address: application.address,
            city: application.city,
            sector: application.sector,
            activities: application.activities,
            pos_provider_name: application.pos_provider_name,
            pos_age_duration_months: application.pos_age_duration_months,
            avg_monthly_pos_sales: application.avg_monthly_pos_sales,
            requested_financing_amount: application.requested_financing_amount,
            preferred_repayment_period_months: application.preferred_repayment_period_months
        };

        return NextResponse.json({
            success: true,
            data: unmaskedContactInfo
        });

    } catch (error) {
        console.error('Error fetching unmasked contact information:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
