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
        // UPDATED: Query using pos_application table with new structure
        const result = await pool.query(
            `SELECT 
                pa.application_id,
                COALESCE(pa.current_application_status, pa.status) as status,
                pa.submitted_at,
                pa.auction_end_time,
                pa.offers_count,
                pa.revenue_collected,
                
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
                pa.contact_person,
                pa.contact_person_number,
                u.email as business_contact_email,
                
                -- Offer Information (from application_offers)
                ao.submitted_at as offer_submitted_at,
                ao.offer_device_setup_fee,
                ao.offer_transaction_fee_mada,
                ao.offer_transaction_fee_visa_mc,
                ao.offer_settlement_time_mada,
                ao.offer_comment,
                ao.status as offer_status
                
             FROM pos_application pa
             JOIN business_users bu ON pa.user_id = bu.user_id
             JOIN users u ON bu.user_id = u.user_id
             LEFT JOIN application_offers ao ON ao.submitted_application_id = pa.application_id AND ao.submitted_by_user_id = $1
             WHERE $1 = ANY(pa.purchased_by)
             ORDER BY pa.submitted_at DESC`,
            [bankUserId]
        );

        return NextResponse.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Failed to fetch purchased leads:', err);
        return NextResponse.json({ success: false, error: 'Failed to fetch purchased leads' }, { status: 500 });
    }
}
