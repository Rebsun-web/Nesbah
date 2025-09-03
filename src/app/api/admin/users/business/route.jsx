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
                    bu.cr_number,
                    bu.trade_name,
                    bu.legal_form,
                    bu.registration_status,
                    bu.headquarter_city_name,
                    bu.issue_date_gregorian,
                    bu.confirmation_date_gregorian,
                    bu.contact_info,
                    bu.activities,
                    bu.has_ecommerce,
                    bu.store_url,
                    bu.cr_capital,
                    bu.cash_capital,
                    bu.management_structure,
                    bu.management_managers,
                    bu.address,
                    bu.sector,
                    bu.in_kind_capital,
                    bu.avg_capital,
                    bu.city,
                    bu.contact_person,
                    bu.contact_person_number,
                    bu.is_verified,
                    bu.verification_date,
                    bu.created_at,
                    bu.updated_at,
                    u.email,
                    u.user_type,
                    u.account_status,
                    u.entity_name
                FROM business_users bu
                JOIN users u ON bu.user_id = u.user_id
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

            // Insert business user data
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
                    businessData.cr_national_number, 
                    businessData.cr_number, 
                    businessData.trade_name, 
                    businessData.legal_form,
                    businessData.registration_status || 'active',
                    businessData.headquarter_city_name,
                    businessData.issue_date_gregorian,
                    businessData.confirmation_date_gregorian,
                    businessData.contact_info ? (typeof businessData.contact_info === 'string' ? businessData.contact_info : JSON.stringify(businessData.contact_info)) : null,
                    businessData.activities ? (Array.isArray(businessData.activities) ? businessData.activities : [businessData.activities]) : null,
                    businessData.has_ecommerce || false,
                    businessData.store_url, 
                    businessData.cr_capital,
                    businessData.cash_capital,
                    businessData.management_structure,
                    businessData.management_managers ? (Array.isArray(businessData.management_managers) ? businessData.management_managers : [businessData.management_managers]) : null,
                    businessData.address, 
                    businessData.sector, 
                    businessData.in_kind_capital, 
                    businessData.avg_capital,
                    businessData.headquarter_district_name,
                    businessData.headquarter_street_name,
                    businessData.headquarter_building_number,
                    businessData.city,
                    businessData.contact_person,
                    businessData.contact_person_number,
                    fetch_from_wathiq, // is_verified based on data source
                    fetch_from_wathiq ? new Date().toISOString() : null, // verification_date
                    new Date().toISOString(), // created_at
                    new Date().toISOString()  // updated_at
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
