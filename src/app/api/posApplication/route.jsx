import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendNewLeadEmail } from '@/lib/email/sendNewLeadEmail';

export async function POST(req) {
    try {
        const body = await req.json();
        const {
            user_id,
            notes,
            uploaded_document,
            uploaded_filename,
            uploaded_mimetype,
            own_pos_system,
            contact_person,
            contact_person_number,
            number_of_pos_devices,
            city_of_operation
        } = body;

        const submitted_at = new Date(); // capture submit time
        const auction_end_time = new Date(submitted_at.getTime() + 48 * 60 * 60 * 1000); // 48 hours from submission time

        const client = await pool.connectWithRetry();
        
        try {
            await client.query('BEGIN');

            // OPTIMIZED: Single query to get business info and validate user exists
            const businessResult = await client.query(
                `SELECT 
                    trade_name, cr_number, cr_national_number, legal_form, 
                    registration_status, issue_date_gregorian, city, activities, 
                    contact_info, has_ecommerce, store_url, cr_capital, 
                    cash_capital, management_structure, management_managers
                 FROM business_users 
                 WHERE user_id = $1`,
                [user_id]
            );

            if (businessResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ success: false, error: 'Business info not found' }, { status: 404 });
            }

            const business = businessResult.rows[0];

            // UPDATED: Insert into pos_application with all data in one query (no ignored_by needed)
            const posAppResult = await client.query(
                `
                INSERT INTO pos_application 
                    (user_id, status, submitted_at, notes, uploaded_document, own_pos_system, 
                     uploaded_filename, uploaded_mimetype, trade_name, cr_number, cr_national_number, 
                     legal_form, registration_status, issue_date_gregorian, city, activities, contact_info, 
                     has_ecommerce, store_url, cr_capital, cash_capital, management_structure, 
                     management_managers, contact_person, contact_person_number, number_of_pos_devices, 
                     city_of_operation, auction_end_time, opened_by, purchased_by)
                VALUES 
                    ($1, 'live_auction', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
                     $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
                RETURNING application_id
                `,
                [
                    user_id, submitted_at, notes || null,
                    uploaded_document ? Buffer.from(uploaded_document, 'base64') : null,
                    own_pos_system ?? null, uploaded_filename || null, uploaded_mimetype || null,
                    business.trade_name, business.cr_number, business.cr_national_number,
                    business.legal_form, business.registration_status, business.issue_date_gregorian,
                    business.city, business.activities, business.contact_info, business.has_ecommerce,
                    business.store_url, business.cr_capital, business.cash_capital,
                    business.management_structure, business.management_managers,
                    contact_person || null, contact_person_number || null,
                    number_of_pos_devices || null, city_of_operation || null, auction_end_time,
                    [], [] // Initialize empty arrays for tracking (no ignored_by needed)
                ]
            );

            const application_id = posAppResult.rows[0].application_id;

            // UPDATED: No need to insert into submitted_applications table anymore
            // All tracking is now handled directly in pos_application table

            // OPTIMIZED: Get bank users for email notification (only if needed)
            const bankUsers = await client.query(
                'SELECT email FROM users WHERE user_type = $1 AND account_status = $2',
                ['bank_user', 'active']
            );

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                application_id: application_id,
            });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Database transaction failed:', err);
            return NextResponse.json({ success: false, error: 'Submission failed' }, { status: 500 });
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Unexpected error:', err);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
