import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
        return NextResponse.json({ success: false, error: 'Missing user_id' }, { status: 400 });
    }

    try {
        console.log('🔍 Fetching leads history for user:', userId);
        
        // First, let's check what's in the submitted_applications table
        const checkQuery = await pool.query(`
          SELECT 
            application_id,
            status,
            purchased_by,
            opened_by,
            ignored_by
          FROM submitted_applications 
          WHERE $1 = ANY(purchased_by) OR $1 = ANY(opened_by)
          LIMIT 5
        `, [userId]);
        
        console.log('🔍 Check query result:', checkQuery.rows);

        // Fetch leads that the bank has purchased (using purchased_by array)
        const result = await pool.query(`
          SELECT 
            sa.application_id,
            sa.status,
            sa.submitted_at,
            sa.auction_end_time,
            sa.offers_count,
            sa.revenue_collected,
            
            -- Business Information
            pa.trade_name,
            pa.city,
            pa.contact_person,
            pa.contact_person_number,
            pa.notes,
            pa.number_of_pos_devices,
            pa.city_of_operation,
            pa.own_pos_system,
            pa.uploaded_filename,
            
            -- Purchase Information (from application_offers if exists)
            COALESCE(ao.submitted_at, sa.submitted_at) as offer_submitted_at,
            ao.offer_device_setup_fee,
            ao.offer_transaction_fee_mada,
            ao.offer_transaction_fee_visa_mc,
            ao.offer_settlement_time_mada,
            ao.offer_comment
            
          FROM submitted_applications sa
          JOIN pos_application pa ON sa.application_id = pa.application_id
          LEFT JOIN application_offers ao ON sa.id = ao.submitted_application_id AND ao.submitted_by_user_id = $1
          WHERE $1 = ANY(sa.purchased_by)
          ORDER BY sa.submitted_at DESC
        `, [userId]);

        console.log('🔍 Main query result:', result.rows);
        return NextResponse.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('❌ Error fetching leads history:', error);
        console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            hint: error.hint
        });
        return NextResponse.json({ success: false, error: 'Failed to fetch leads history' }, { status: 500 });
    }
}
