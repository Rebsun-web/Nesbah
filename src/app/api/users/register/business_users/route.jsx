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
            // 1.1 Required Data Fields from Wathiq API
            cr_number,
            trade_name,
            legal_form,
            registration_status,
            headquarter_city_name,
            issue_date_gregorian,
            confirmation_date_gregorian,
            contact_info,
            activities,
            has_ecommerce,
            store_url,
            cr_capital,
            cash_capital,
            management_structure,
            management_managers,
            // Additional fields for completeness
            address,
            sector,
            in_kind_capital,
            avg_capital,
            headquarter_district_name,
            headquarter_street_name,
            headquarter_building_number,
            city,
            contact_person,
            contact_person_number
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
        const client = await pool.connectWithRetry(2, 1000, 'app_api_users_register_business_users_route.jsx_route');
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

            // Insert business user data with all required Wathiq API fields
            await client.query(
                `INSERT INTO business_users (
                    user_id, 
                    cr_national_number, 
                    cr_number, 
                    trade_name, 
                    legal_form,
                    registration_status,
                    headquarter_city_name,
                    issue_date_gregorian,
                    confirmation_date_gregorian,
                    contact_info,
                    activities,
                    has_ecommerce,
                    store_url,
                    cr_capital,
                    cash_capital,
                    management_structure,
                    management_managers,
                    address,
                    sector,
                    in_kind_capital,
                    avg_capital,
                    headquarter_district_name,
                    headquarter_street_name,
                    headquarter_building_number,
                    city,
                    contact_person,
                    contact_person_number,
                    is_verified,
                    verification_date,
                    created_at,
                    updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
                )`,
                [
                    user_id, 
                    cr_national_number, 
                    cr_number, 
                    trade_name, 
                    legal_form,
                    registration_status || 'active',
                    headquarter_city_name,
                    issue_date_gregorian,
                    confirmation_date_gregorian,
                    contact_info ? (typeof contact_info === 'string' ? contact_info : JSON.stringify(contact_info)) : null,
                    activities ? (Array.isArray(activities) ? activities : [activities]) : null,
                    has_ecommerce || false,
                    store_url, 
                    cr_capital,
                    cash_capital,
                    management_structure,
                    management_managers ? (Array.isArray(management_managers) ? management_managers : [management_managers]) : null,
                    address, 
                    sector, 
                    in_kind_capital, 
                    avg_capital,
                    headquarter_district_name,
                    headquarter_street_name,
                    headquarter_building_number,
                    city,
                    contact_person,
                    contact_person_number,
                    true, // is_verified - data from Wathiq is verified
                    new Date().toISOString(), // verification_date
                    new Date().toISOString(), // created_at
                    new Date().toISOString()  // updated_at
                ]
            );

            await client.query('COMMIT');
            
            return NextResponse.json({ 
                success: true, 
                message: 'Business registered successfully with all Wathiq API data',
                data: {
                    user_id,
                    email,
                    trade_name,
                    cr_national_number,
                    wathiq_fields_stored: {
                        cr_number,
                        legal_form,
                        registration_status,
                        headquarter_city_name,
                        issue_date_gregorian,
                        confirmation_date_gregorian,
                        activities: activities?.length || 0,
                        has_ecommerce,
                        store_url,
                        cr_capital,
                        cash_capital,
                        management_structure,
                        management_managers: management_managers?.length || 0
                    }
                }
            });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Database error during business user creation:', err);
            return NextResponse.json(
                { success: false, error: 'Failed to create business user account' },
                { status: 500 }
            );
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Unexpected error during business user registration:', err);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
