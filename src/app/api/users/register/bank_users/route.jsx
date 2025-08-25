import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req) {
    try {
        const body = await req.json();
        const { 
            email, 
            password, 
            sama_license_number,
            entity_name,
            bank_type,
            license_status,
            establishment_date,
            authorized_capital,
            head_office_address,
            sama_compliance_status,
            number_of_branches,
            contact_info,
            credit_limit = 10000.00,
            contact_person,
            contact_person_number,
            logo_url
        } = body;

        // Validate required fields
        if (!email || !password || !sama_license_number || !entity_name) {
            return NextResponse.json(
                { success: false, error: 'Email, password, SAMA license number, and entity name are required' },
                { status: 400 }
            );
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Check if user already exists
            const existingUser = await client.query(
                `SELECT user_id FROM users WHERE email = $1 OR user_id IN (
                    SELECT user_id FROM bank_users WHERE sama_license_number = $2
                )`,
                [email, sama_license_number]
            );

            if (existingUser.rowCount > 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'User with this email or SAMA license number already exists' },
                    { status: 409 }
                );
            }

            // Hash the password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Create user record
            const userRes = await client.query(
                `INSERT INTO users (email, password, user_type, entity_name, account_status, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                 RETURNING user_id`,
                [email, hashedPassword, 'bank_user', entity_name, 'pending_review']
            );
            const user_id = userRes.rows[0].user_id;

            // Create bank user record with comprehensive data
            await client.query(
                `INSERT INTO bank_users (
                    user_id, 
                    email, 
                    sama_license_number,
                    bank_type,
                    license_status,
                    establishment_date,
                    authorized_capital,
                    head_office_address,
                    sama_compliance_status,
                    number_of_branches,
                    contact_info,
                    credit_limit, 
                    contact_person, 
                    contact_person_number,
                    logo_url
                )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
                [
                    user_id,
                    email,
                    sama_license_number,
                    bank_type,
                    license_status,
                    establishment_date,
                    authorized_capital,
                    head_office_address,
                    sama_compliance_status,
                    number_of_branches,
                    contact_info ? JSON.stringify(contact_info) : null,
                    credit_limit,
                    contact_person || null,
                    contact_person_number || null,
                    logo_url || null
                ]
            );

            // Generate unique application ID
            const applicationId = `BANK-${new Date().getFullYear()}-${user_id.toString().padStart(6, '0')}`;

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Bank registration submitted successfully',
                data: {
                    application_id: applicationId,
                    user_id,
                    email,
                    entity_name,
                    status: 'pending_review',
                    review_timeline: {
                        documents_received: 'completed',
                        compliance_verification: '2-3 days',
                        sama_cross_check: '1-2 days',
                        final_approval: '1 day'
                    }
                }
            });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Database transaction failed:', err);
            return NextResponse.json(
                { success: false, error: 'Registration failed' },
                { status: 500 }
            );
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Unexpected error:', err);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
