import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
    const bankUserId = req.headers.get('x-user-id');

    if (!bankUserId) {
        return NextResponse.json({ success: false, error: 'Missing bank user ID' }, { status: 400 });
    }

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
                bu.form_name,
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
                
                -- Offer Information
                ao.offer_device_setup_fee,
                ao.offer_transaction_fee_mada,
                ao.offer_transaction_fee_visa_mc,
                ao.offer_settlement_time_mada,
                ao.offer_comment,
                ao.submitted_at as offer_submitted_at,
                ao.status as offer_status
                
             FROM submitted_applications sa
             JOIN pos_application pa ON sa.application_id = pa.application_id
             JOIN business_users bu ON pa.user_id = bu.user_id
             JOIN users u ON bu.user_id = u.user_id
             LEFT JOIN application_offers ao ON sa.id = ao.submitted_application_id AND ao.submitted_by_user_id = $1
             WHERE $1 = ANY(sa.purchased_by)
             ORDER BY sa.submitted_at DESC`,
            [bankUserId]
        );

        return NextResponse.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Failed to fetch purchased leads:', err);
        return NextResponse.json({ success: false, error: 'Failed to fetch purchased leads' }, { status: 500 });
    }
}
