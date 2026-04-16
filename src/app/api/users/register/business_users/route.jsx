import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import { sendBusinessRegistrationEmail } from '@/lib/email/emailNotifications';

export async function POST(req) {
    console.log('🚀 ========== BUSINESS USER REGISTRATION API CALLED ==========');
    try {
        const body = await req.json();
        console.log('📝 Registration request received:', {
            email: body.email,
            cr_national_number: body.cr_national_number,
            hasPassword: !!body.password
        });
        
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
            console.log('❌ Missing required fields');
            return NextResponse.json(
                { success: false, error: 'CR National Number, password, and email are required' },
                { status: 400 }
            );
        }

        console.log('🔒 Hashing password...');
        // Hash the password before storing
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('✅ Password hashed successfully');

        // Check if user already exists
        console.log('🔍 Checking for existing user...');
        const client = await pool.connectWithRetry(2, 1000, 'app_api_users_register_business_users_route.jsx_route');
        try {
            const existingUser = await client.query(
                `SELECT u.user_id, u.email, bu.cr_national_number 
                 FROM users u
                 LEFT JOIN business_users bu ON u.user_id = bu.user_id
                 WHERE u.email = $1 OR bu.cr_national_number = $2`,
                [email, cr_national_number]
            );

            if (existingUser.rowCount > 0) {
                const existing = existingUser.rows[0];
                let errorMsg = 'User already exists: ';
                if (existing.email === email) {
                    errorMsg += `Email ${email} is already registered`;
                }
                if (existing.cr_national_number === cr_national_number) {
                    if (errorMsg !== 'User already exists: ') errorMsg += ' and ';
                    errorMsg += `CR number ${cr_national_number} is already registered`;
                }
                console.log(`❌ ${errorMsg}`);
                return NextResponse.json(
                    { success: false, error: errorMsg },
                    { status: 409 }
                );
            }
            console.log('✅ No existing user found, proceeding with registration');

            await client.query('BEGIN');

            console.log('📝 Creating user record...');
            // Insert user record
            const userRes = await client.query(
                `INSERT INTO users (email, password, user_type, entity_name, account_status, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING user_id`,
                [email, hashedPassword, 'business_user', trade_name || 'Business User', 'active']
            );
            const user_id = userRes.rows[0].user_id;
            console.log(`✅ User record created with ID: ${user_id}`);

            // Upsert into wathiq_data — canonical store for all Wathiq fields
            console.log('📝 Upserting wathiq_data record...');
            const wathiqResult = await client.query(
                `INSERT INTO wathiq_data (
                    cr_national_number,
                    cr_number,
                    trade_name,
                    legal_form,
                    registration_status,
                    issue_date_gregorian,
                    confirmation_date_gregorian,
                    city,
                    headquarter_district_name,
                    headquarter_street_name,
                    headquarter_building_number,
                    has_ecommerce,
                    store_url,
                    cr_capital,
                    cash_capital,
                    in_kind_capital,
                    avg_capital,
                    management_structure,
                    management_managers,
                    activities,
                    contact_info,
                    sector,
                    is_verified,
                    verification_date,
                    wathiq_fetched_at,
                    created_at,
                    updated_at
                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,
                    TRUE, NOW(), NOW(), NOW(), NOW()
                )
                ON CONFLICT (cr_national_number) DO UPDATE SET
                    cr_number                   = EXCLUDED.cr_number,
                    trade_name                  = EXCLUDED.trade_name,
                    legal_form                  = EXCLUDED.legal_form,
                    registration_status         = EXCLUDED.registration_status,
                    issue_date_gregorian        = EXCLUDED.issue_date_gregorian,
                    confirmation_date_gregorian = EXCLUDED.confirmation_date_gregorian,
                    city                        = EXCLUDED.city,
                    headquarter_district_name   = EXCLUDED.headquarter_district_name,
                    headquarter_street_name     = EXCLUDED.headquarter_street_name,
                    headquarter_building_number = EXCLUDED.headquarter_building_number,
                    has_ecommerce               = EXCLUDED.has_ecommerce,
                    store_url                   = EXCLUDED.store_url,
                    cr_capital                  = EXCLUDED.cr_capital,
                    cash_capital                = EXCLUDED.cash_capital,
                    in_kind_capital             = EXCLUDED.in_kind_capital,
                    avg_capital                 = EXCLUDED.avg_capital,
                    management_structure        = EXCLUDED.management_structure,
                    management_managers         = EXCLUDED.management_managers,
                    activities                  = EXCLUDED.activities,
                    contact_info                = EXCLUDED.contact_info,
                    sector                      = EXCLUDED.sector,
                    is_verified                 = TRUE,
                    verification_date           = NOW(),
                    wathiq_fetched_at           = NOW(),
                    updated_at                  = NOW()
                RETURNING id`,
                [
                    cr_national_number,                                                                            // $1
                    cr_number,                                                                                     // $2
                    trade_name,                                                                                    // $3
                    legal_form,                                                                                    // $4
                    registration_status || 'active',                                                              // $5
                    issue_date_gregorian,                                                                         // $6
                    confirmation_date_gregorian,                                                                  // $7
                    city || headquarter_city_name,                                                                // $8
                    headquarter_district_name,                                                                    // $9
                    headquarter_street_name,                                                                      // $10
                    headquarter_building_number,                                                                  // $11
                    has_ecommerce || false,                                                                       // $12
                    store_url,                                                                                    // $13
                    cr_capital,                                                                                   // $14
                    cash_capital,                                                                                 // $15
                    in_kind_capital,                                                                              // $16
                    avg_capital,                                                                                  // $17
                    management_structure,                                                                         // $18
                    management_managers ? JSON.stringify(Array.isArray(management_managers) ? management_managers : [management_managers]) : null, // $19
                    activities ? (Array.isArray(activities) ? activities : [activities]) : null,                  // $20
                    contact_info ? (typeof contact_info === 'string' ? contact_info : JSON.stringify(contact_info)) : null, // $21
                    sector || 'General',                                                                          // $22
                ]
            );
            const wathiq_data_id = wathiqResult.rows[0].id;
            console.log(`✅ wathiq_data record upserted, id=${wathiq_data_id}`);

            console.log('📝 Creating business user record...');
            // Insert business user record — all Wathiq fields are in wathiq_data (FK: wathiq_data_id)
            await client.query(
                `INSERT INTO business_users (
                    user_id,
                    cr_national_number,
                    wathiq_data_id,
                    contact_person,
                    contact_person_number,
                    is_verified,
                    verification_date,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    user_id,                        // $1
                    cr_national_number,             // $2
                    wathiq_data_id,                 // $3
                    contact_person,                 // $4
                    contact_person_number,          // $5
                    true,                           // $6 is_verified
                    new Date().toISOString(),       // $7 verification_date
                    new Date().toISOString(),       // $8 created_at
                    new Date().toISOString(),       // $9 updated_at
                ]
            );
            console.log(`✅ Business user record created`);

            await client.query('COMMIT');
            console.log('✅ Transaction committed successfully');

            // Send welcome email to business user
            try {
                const businessData = {
                    trade_name,
                    cr_number,
                    cr_national_number,
                    registration_status: registration_status || 'active'
                };
                
                await sendBusinessRegistrationEmail(email, businessData);
                console.log(`✅ Business registration welcome email sent to ${email}`);
            } catch (emailError) {
                console.error(`❌ Failed to send business registration email to ${email}:`, emailError);
                // Don't fail the registration if email fails
            }
            
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
            console.error('❌ Database error during business user creation:', err);
            console.error('❌ Error details:', {
                message: err.message,
                code: err.code,
                detail: err.detail,
                constraint: err.constraint
            });
            
            // Provide more specific error messages based on error type
            let errorMessage = 'Failed to create business user account';
            if (err.code === '23505') { // Unique violation
                if (err.constraint?.includes('email')) {
                    errorMessage = 'This email is already registered';
                } else if (err.constraint?.includes('cr_national_number')) {
                    errorMessage = 'This CR number is already registered';
                } else {
                    errorMessage = 'A user with this information already exists';
                }
            } else if (err.code === '23503') { // Foreign key violation
                errorMessage = 'Invalid reference data';
            } else if (err.code === '23502') { // Not null violation
                errorMessage = `Required field missing: ${err.column || 'unknown'}`;
            }
            
            return NextResponse.json(
                { success: false, error: errorMessage, details: err.message },
                { status: 500 }
            );
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('❌ Unexpected error during business user registration:', err);
        console.error('❌ Error stack:', err.stack);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: err.message },
            { status: 500 }
        );
    }
}
