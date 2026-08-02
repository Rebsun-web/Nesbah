import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import AdminAuth from '@/lib/auth/admin-auth';
import WathiqAPIService from '@/lib/wathiq-api-service';

// GET - Fetch all business users with comprehensive data
export async function GET(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_users_business_route.jsx_GET');
        
        try {
            // Fetch all business users with comprehensive data
            const result = await client.query(`
                SELECT
                    bu.user_id,
                    bu.cr_national_number,
                    bu.contact_person,
                    bu.contact_person_number,
                    bu.created_at,
                    bu.updated_at,
                    -- Wathiq data (canonical source)
                    wd.cr_number,
                    wd.trade_name,
                    wd.legal_form,
                    wd.registration_status,
                    wd.city AS headquarter_city_name,
                    wd.city,
                    wd.issue_date_gregorian,
                    wd.confirmation_date_gregorian,
                    wd.contact_info,
                    wd.activities,
                    wd.has_ecommerce,
                    wd.store_url,
                    wd.cr_capital,
                    wd.cash_capital,
                    wd.management_structure,
                    wd.management_managers,
                    wd.sector,
                    wd.in_kind_capital,
                    wd.avg_capital,
                    wd.is_verified,
                    wd.verification_date,
                    u.email,
                    u.user_type,
                    u.account_status,
                    u.entity_name,
                    -- Latest application onboarding fields
                    pa.financing_type,
                    pa.approximate_financing_amount,
                    pa.amount_range_code
                FROM business_users bu
                JOIN users u ON bu.user_id = u.user_id
                LEFT JOIN wathiq_data wd ON bu.wathiq_data_id = wd.id
                LEFT JOIN LATERAL (
                    SELECT financing_type, approximate_financing_amount, amount_range_code
                    FROM pos_application
                    WHERE user_id = bu.user_id
                    ORDER BY submitted_at DESC
                    LIMIT 1
                ) pa ON true
                ORDER BY bu.created_at DESC
            `);

            return NextResponse.json({
                success: true,
                data: {
                    users: result.rows,
                    total_count: result.rowCount
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error fetching business users:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch business users' },
            { status: 500 }
        );
    }
}

// POST - Create new business user (admin can create manually or fetch from Wathiq)
export async function POST(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        const body = await req.json();
        const { 
            cr_national_number, 
            email,
            password,
            fetch_from_wathiq = false,
            // Manual data fields
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
            city,
            contact_person,
            contact_person_number
        } = body;

        if (!cr_national_number || !email || !password) {
            return NextResponse.json(
                { success: false, error: 'CR National Number, email, and password are required' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_users_business_route.jsx_POST');
        
        try {
            await client.query('BEGIN');

            // Check if user already exists
            const existingUser = await client.query(
                `SELECT user_id FROM users WHERE email = $1 OR user_id IN (
                    SELECT user_id FROM business_users WHERE cr_national_number = $2
                )`,
                [email, cr_national_number]
            );

            if (existingUser.rowCount > 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'User with this email or CR number already exists' },
                    { status: 409 }
                );
            }

            let businessData = {};

            if (fetch_from_wathiq) {
                // Fetch data from Wathiq API
                try {
                    console.log(`🔍 Fetching Wathiq data for CR: ${cr_national_number}`);
                    businessData = await WathiqAPIService.fetchBusinessData(cr_national_number, 'en');
                    console.log('✅ Wathiq data fetched successfully');
                } catch (error) {
                    console.error('❌ Wathiq API error:', error);
                    await client.query('ROLLBACK');
                    return NextResponse.json(
                        { success: false, error: 'Failed to fetch data from Wathiq API' },
                        { status: 502 }
                    );
                }
            } else {
                // Use manually provided data
                businessData = {
                    cr_national_number,
                    cr_number: cr_national_number,
                    trade_name,
                    legal_form,
                    registration_status: registration_status || 'active',
                    headquarter_city_name,
                    issue_date_gregorian,
                    confirmation_date_gregorian,
                    contact_info,
                    activities,
                    has_ecommerce: has_ecommerce || false,
                    store_url,
                    cr_capital,
                    cash_capital,
                    management_structure,
                    management_managers,
                    address,
                    sector,
                    in_kind_capital,
                    avg_capital,
                    city,
                    contact_person,
                    contact_person_number
                };
            }

            // Hash the password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Insert user record
            const userRes = await client.query(
                `INSERT INTO users (email, password, user_type, entity_name, account_status, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING user_id`,
                [email, hashedPassword, 'business_user', businessData.trade_name || 'Business User', 'active']
            );
            const user_id = userRes.rows[0].user_id;

            // Upsert Wathiq data into canonical wathiq_data table
            const wathiqUpsertResult = await client.query(
                `INSERT INTO wathiq_data (
                    cr_national_number, cr_number, trade_name, legal_form, registration_status,
                    issue_date_gregorian, confirmation_date_gregorian, city,
                    has_ecommerce, store_url, cr_capital, cash_capital, in_kind_capital,
                    avg_capital, management_structure, management_managers, activities,
                    contact_info, sector, headquarter_city_name,
                    headquarter_district_name, headquarter_street_name, headquarter_building_number,
                    is_verified, updated_at
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,NOW())
                ON CONFLICT (cr_national_number) DO UPDATE SET
                    cr_number = EXCLUDED.cr_number, trade_name = EXCLUDED.trade_name,
                    legal_form = EXCLUDED.legal_form, registration_status = EXCLUDED.registration_status,
                    issue_date_gregorian = EXCLUDED.issue_date_gregorian,
                    confirmation_date_gregorian = EXCLUDED.confirmation_date_gregorian,
                    city = EXCLUDED.city, has_ecommerce = EXCLUDED.has_ecommerce,
                    store_url = EXCLUDED.store_url, cr_capital = EXCLUDED.cr_capital,
                    cash_capital = EXCLUDED.cash_capital, in_kind_capital = EXCLUDED.in_kind_capital,
                    avg_capital = EXCLUDED.avg_capital, management_structure = EXCLUDED.management_structure,
                    management_managers = EXCLUDED.management_managers, activities = EXCLUDED.activities,
                    contact_info = EXCLUDED.contact_info, sector = EXCLUDED.sector,
                    headquarter_city_name = EXCLUDED.headquarter_city_name,
                    headquarter_district_name = EXCLUDED.headquarter_district_name,
                    headquarter_street_name = EXCLUDED.headquarter_street_name,
                    headquarter_building_number = EXCLUDED.headquarter_building_number,
                    is_verified = EXCLUDED.is_verified, updated_at = NOW()
                RETURNING id`,
                [
                    businessData.cr_national_number,
                    businessData.cr_number || null,
                    businessData.trade_name || null,
                    businessData.legal_form || null,
                    businessData.registration_status || 'active',
                    businessData.issue_date_gregorian || null,
                    businessData.confirmation_date_gregorian || null,
                    businessData.city || null,
                    businessData.has_ecommerce || false,
                    businessData.store_url || null,
                    businessData.cr_capital || null,
                    businessData.cash_capital || null,
                    businessData.in_kind_capital || null,
                    businessData.avg_capital || null,
                    businessData.management_structure || null,
                    businessData.management_managers ? (Array.isArray(businessData.management_managers) ? JSON.stringify(businessData.management_managers) : JSON.stringify([businessData.management_managers])) : null,
                    businessData.activities ? (Array.isArray(businessData.activities) ? businessData.activities : [businessData.activities]) : null,
                    businessData.contact_info ? (typeof businessData.contact_info === 'string' ? businessData.contact_info : JSON.stringify(businessData.contact_info)) : null,
                    businessData.sector || null,
                    businessData.headquarter_city_name || null,
                    businessData.headquarter_district_name || null,
                    businessData.headquarter_street_name || null,
                    businessData.headquarter_building_number || null,
                    fetch_from_wathiq || false,
                ]
            );
            const wathiq_data_id = wathiqUpsertResult.rows[0].id;

            // Insert business user record — Wathiq fields live in wathiq_data (FK: wathiq_data_id)
            await client.query(
                `INSERT INTO business_users (
                    user_id, cr_national_number, wathiq_data_id,
                    contact_person, contact_person_number,
                    is_verified, verification_date,
                    created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
                [
                    user_id,
                    businessData.cr_national_number,
                    wathiq_data_id,
                    businessData.contact_person || null,
                    businessData.contact_person_number || null,
                    fetch_from_wathiq || false,
                    fetch_from_wathiq ? new Date().toISOString() : null,
                ]
            );

            await client.query('COMMIT');
            
            return NextResponse.json({
                success: true,
                message: `Business user created successfully${fetch_from_wathiq ? ' with Wathiq API data' : ' manually'}`,
                data: {
                    user_id,
                    email,
                    trade_name: businessData.trade_name,
                    cr_national_number: businessData.cr_national_number,
                    wathiq_data_used: fetch_from_wathiq,
                    created_at: new Date().toISOString()
                }
            });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Database error during business user creation:', err);
            return NextResponse.json(
                { success: false, error: 'Failed to create business user' },
                { status: 500 }
            );
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error creating business user:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
