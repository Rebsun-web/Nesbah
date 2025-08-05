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

        // 🛰️ Fetch business info from business_users table based on user_id
        const { rows } = await pool.query(
            `SELECT * FROM business_users WHERE user_id = $1`,
            [user_id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Business info not found' }, { status: 404 });
        }

        const business = rows[0];

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Insert into pos_application
            const posAppResult = await client.query(
                `
                INSERT INTO pos_application 
                    (user_id, status, submitted_at, notes, uploaded_document, own_pos_system, uploaded_filename, uploaded_mimetype,
                     trade_name, cr_number, cr_national_number, legal_form, registration_status, 
                     issue_date, city, activities, contact_info, has_ecommerce, store_url, 
                     cr_capital, cash_capital, management_structure, management_names,
                     contact_person, contact_person_number, number_of_pos_devices, city_of_operation)
                VALUES 
                    ($1, 'submitted', $2, $3, $4, $5, $21, $22,
                     $6, $7, $8, $9, $10,
                     $11, $12, $13, $14, $15, $16,
                     $17, $18, $19, $20,
                     $23, $24, $25, $26)
                RETURNING application_id
                `,
                [
                    user_id,
                    submitted_at,
                    notes || null,
                    uploaded_document ? Buffer.from(uploaded_document, 'base64') : null,
                    own_pos_system ?? null,
                    business.trade_name,
                    business.cr_number,
                    business.cr_national_number,
                    business.legal_form,
                    business.registration_status,
                    business.issue_date,
                    business.city,
                    business.activities,
                    business.contact_info,
                    business.has_ecommerce,
                    business.store_url,
                    business.cr_capital,
                    business.cash_capital,
                    business.management_structure,
                    business.management_names,
                    uploaded_filename || null,
                    uploaded_mimetype || null,
                    contact_person || null,
                    contact_person_number || null,
                    number_of_pos_devices || null,
                    city_of_operation || null
                ]
            );

            const application_id = posAppResult.rows[0].application_id;

            // Insert into submitted_applications
            await client.query(
                `
                INSERT INTO submitted_applications
                    (application_id, application_type, status, opened_by)
                VALUES
                    ($1, $2, $3, $4)
                `,
                [
                    application_id,
                    'pos',          // Application type
                    'unopened',     // Default status
                    []              // Empty opened_by array initially
                ]
            );

            const bankUsers = await client.query(
                'SELECT email FROM users WHERE user_type = $1',
                ['bank_user']
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
