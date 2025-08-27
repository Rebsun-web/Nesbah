import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateAPIRequest } from '@/lib/auth/api-auth';

export async function GET(req) {
    // Authenticate the request
    const authResult = await authenticateAPIRequest(req, 'bank_user');
    if (!authResult.success) {
        return NextResponse.json(
            { success: false, error: authResult.error },
            { status: authResult.status || 401 }
        );
    }
    
    const bankUserId = authResult.user.user_id;

    try {
        const result = await pool.query(
            `SELECT 
                sa.application_id,
                sa.status,
                sa.submitted_at,
                sa.auction_end_time,
                sa.offers_count,
                sa.revenue_collected,
                
                -- Business Information (Wathiq API data)
                bu.trade_name,
                bu.cr_number,
                bu.cr_national_number,
                bu.registration_status,
                bu.address,
                bu.sector,
                bu.cr_capital,
                bu.cash_capital,
                bu.in_kind_capital,
                bu.has_ecommerce,
                bu.store_url,
                bu.legal_form,
                bu.issue_date_gregorian,
                bu.management_structure,
                bu.management_managers,
                bu.contact_info,
                
                -- Application Details
                pa.notes,
                pa.number_of_pos_devices,
                pa.city_of_operation,
                pa.own_pos_system,
                pa.uploaded_filename,
                
                -- Business Owner Personal Details (NOT from Wathiq API)
                pa.contact_person as business_contact_person,
                pa.contact_person_number as business_contact_telephone,
                u.email as business_contact_email,
                
                -- Approved Lead Information
                al.purchased_at,
                al.offer_submitted_at,
                al.offer_device_setup_fee,
                al.offer_transaction_fee_mada,
                al.offer_transaction_fee_visa_mc,
                al.offer_settlement_time_mada,
                al.offer_comment,
                al.status as lead_status
                
             FROM submitted_applications sa
             JOIN pos_application pa ON sa.application_id = pa.application_id
             JOIN business_users bu ON pa.user_id = bu.user_id
             JOIN users u ON bu.user_id = u.user_id
             JOIN approved_leads al ON al.application_id = sa.application_id AND al.bank_user_id = $1
             WHERE $1 = ANY(sa.purchased_by)
             ORDER BY al.purchased_at DESC`,
            [bankUserId]
        );

        return NextResponse.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Failed to fetch purchased leads:', err);
        return NextResponse.json({ success: false, error: 'Failed to fetch purchased leads' }, { status: 500 });
    }
}
