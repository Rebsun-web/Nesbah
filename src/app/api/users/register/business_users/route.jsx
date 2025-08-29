import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req) {
    try {
        const body = await req.json();
        const { 
            cr_national_number, 
            password, 
            email,
            // Additional fields from verified data
            cr_number,
            trade_name,
            registration_status,
            address,
            sector,
            cr_capital,
            cash_capital,
            in_kind_capital,
            contact_info,
            store_url,
            legal_form,
            issue_date_gregorian,
            confirmation_date_gregorian,
            has_ecommerce,
            management_structure,
            management_managers
        } = body;

        // Validate required fields
        if (!cr_national_number || !password || !email) {
            return NextResponse.json(
                { success: false, error: 'CR National Number, password, and email are required' },
                { status: 400 }
            );
        }

        // Hash the password before storing
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Check if user already exists
        const client = await pool.connectWithRetry();
        try {
            const existingUser = await client.query(
                `SELECT user_id FROM users WHERE email = $1 OR user_id IN (
                    SELECT user_id FROM business_users WHERE cr_national_number = $2
                )`,
                [email, cr_national_number]
            );

            if (existingUser.rowCount > 0) {
                return NextResponse.json(
                    { success: false, error: 'User with this email or CR number already exists' },
                    { status: 409 }
                );
            }

            await client.query('BEGIN');

            // Insert user record
            const userRes = await client.query(
                `INSERT INTO users (email, password, user_type, entity_name, account_status, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING user_id`,
                [email, hashedPassword, 'business_user', trade_name || 'Business User', 'active']
            );
            const user_id = userRes.rows[0].user_id;

            // Insert business user data
            await client.query(
                `INSERT INTO business_users
                 (user_id, cr_number, cr_national_number, trade_name, address, sector, registration_status,
                  cash_capital, in_kind_capital, contact_info, store_url, legal_form, issue_date_gregorian,
                  confirmation_date_gregorian, has_ecommerce, management_structure, management_managers, cr_capital)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
                [
                    user_id, 
                    cr_number, 
                    cr_national_number, 
                    trade_name, 
                    address, 
                    sector, 
                    registration_status || 'active',
                    cash_capital, 
                    in_kind_capital, 
                    contact_info ? (typeof contact_info === 'string' ? contact_info : JSON.stringify(contact_info)) : null,
                    store_url, 
                    legal_form, 
                    issue_date_gregorian, 
                    confirmation_date_gregorian, 
                    has_ecommerce, 
                    management_structure,
                    management_managers ? (typeof management_managers === 'string' ? management_managers : JSON.stringify(management_managers)) : null,
                    cr_capital
                ]
            );

            await client.query('COMMIT');
            
            return NextResponse.json({ 
                success: true, 
                message: 'Business registered successfully',
                data: {
                    user_id,
                    email,
                    trade_name,
                    cr_national_number
                }
            });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Database transaction failed:', err);
            return NextResponse.json({ success: false, error: 'Registration failed' }, { status: 500 });
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Unexpected error:', err);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
