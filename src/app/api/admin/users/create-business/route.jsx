import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';
import WathiqAPIService from '@/lib/wathiq-api-service';

export async function POST(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session using session manager
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        // Get admin user from session (no database query needed)
        const adminUser = sessionValidation.adminUser;

        const body = await req.json();
        const { 
            cr_national_number, 
            trade_name, 
            // Optional fields that can be provided manually or fetched from Wathiq
            cr_number,
            address,
            sector,
            registration_status,
            cash_capital,
            in_kind_capital,
            contact_info,
            store_url,
            legal_form,
            issue_date_gregorian,
            confirmation_date_gregorian,
            has_ecommerce,
            management_structure,
            management_managers,
            cr_capital,
            city,
            contact_person,
            contact_person_number,
            // Flag to determine if we should fetch from Wathiq API
            fetch_from_wathiq = true
        } = body;

        // If fetch_from_wathiq is true, we need cr_national_number
        if (fetch_from_wathiq && !cr_national_number) {
            return NextResponse.json(
                { success: false, error: 'cr_national_number is required when fetching from Wathiq API' },
                { status: 400 }
            );
        }

        // If not fetching from Wathiq, we need at least trade_name
        if (!fetch_from_wathiq && !trade_name) {
            return NextResponse.json(
                { success: false, error: 'trade_name is required when not fetching from Wathiq API' },
                { status: 400 }
            );
        }

        let wathiqData = null;

        // Fetch data from Wathiq API if requested
        if (fetch_from_wathiq && cr_national_number) {
            try {
                console.log(`🔍 Fetching comprehensive Wathiq data for CR: ${cr_national_number}`);
                wathiqData = await WathiqAPIService.fetchBusinessData(cr_national_number, 'en');
                console.log('✅ Wathiq data fetched successfully');
            } catch (error) {
                console.error('❌ Wathiq API request failed:', error);
                return NextResponse.json(
                    { success: false, error: `Failed to fetch data from Wathiq API: ${error.message}` },
                    { status: 502 }
                );
            }
        }

        // Use Wathiq data or provided values as fallbacks
        const finalData = wathiqData ? {
            // Use Wathiq data as primary source, with provided values as overrides
            email: email, // Add email field
            password: password, // Add password field
            cr_national_number: cr_national_number || wathiqData.cr_national_number,
            cr_number: cr_number || wathiqData.cr_number,
            trade_name: trade_name || wathiqData.trade_name,
            registration_status: registration_status || wathiqData.registration_status || 'active',
            address: address || wathiqData.address,
            sector: sector || wathiqData.sector,
            city: city || wathiqData.city,
            cr_capital: cr_capital || wathiqData.cr_capital,
            cash_capital: cash_capital || wathiqData.cash_capital,
            in_kind_capital: in_kind_capital || wathiqData.in_kind_capital,
            avg_capital: wathiqData.avg_capital,
            legal_form: legal_form || wathiqData.legal_form,
            issue_date_gregorian: issue_date_gregorian || wathiqData.issue_date_gregorian,
            confirmation_date_gregorian: confirmation_date_gregorian || wathiqData.confirmation_date_gregorian,
            has_ecommerce: has_ecommerce !== undefined ? has_ecommerce : wathiqData.has_ecommerce,
            store_url: store_url || wathiqData.store_url,
            management_structure: management_structure || wathiqData.management_structure,
            management_managers: management_managers || wathiqData.management_managers,
            activities: wathiqData.activities,
            contact_info: contact_info || wathiqData.contact_info,
            is_verified: wathiqData.is_verified,
            verification_date: wathiqData.verification_date,
            admin_notes: wathiqData.admin_notes,
            contact_person: contact_person || null,
            contact_person_number: contact_person_number || null,
        } : {
            // Manual data only
            email: email, // Add email field
            password: password, // Add password field
            cr_national_number: cr_national_number,
            cr_number: cr_number,
            trade_name: trade_name,
            registration_status: registration_status || 'active',
            address: address,
            sector: sector,
            city: city,
            cr_capital: cr_capital,
            cash_capital: cash_capital,
            in_kind_capital: in_kind_capital,
            legal_form: legal_form,
            issue_date_gregorian: issue_date_gregorian,
            confirmation_date_gregorian: confirmation_date_gregorian,
            has_ecommerce: has_ecommerce !== undefined ? has_ecommerce : false,
            store_url: store_url,
            management_structure: management_structure,
            management_managers: management_managers,
            contact_info: contact_info,
            contact_person: contact_person,
            contact_person_number: contact_person_number,
            is_verified: false,
            verification_date: null,
            admin_notes: null,
        };

        // Validate registration status if it came from Wathiq
        if (wathiqData && finalData.registration_status !== 'active') {
            return NextResponse.json(
                { success: false, error: 'Registration status is not active. Cannot proceed.' },
                { status: 403 }
            );
        }

        // Log the final data for debugging
        console.log('🔍 Create Business - Final data:', {
            email: finalData.email,
            hasEmail: !!finalData.email,
            hasPassword: !!finalData.password,
            cr_national_number: finalData.cr_national_number,
            trade_name: finalData.trade_name
        });

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_users_create-business_route.jsx_route');
        try {
            await client.query('BEGIN');

            // First, create a user record in the users table
            const userResult = await client.query(
                `INSERT INTO users (email, password, user_type, entity_name, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW())
                 RETURNING user_id`,
                [
                    finalData.email || `business_${finalData.cr_national_number}@nesbah.com`,
                    finalData.password || 'default_password_hash', // Use provided password or fallback
                    'business_user',
                    finalData.trade_name
                ]
            );
            
            const user_id = userResult.rows[0].user_id;
            console.log(`✅ Created user record with ID: ${user_id}`);

            // Then create business user record with comprehensive data
            const businessUserResult = await client.query(
                `INSERT INTO business_users (
                    user_id, cr_national_number, cr_number, trade_name, address, sector, 
                    registration_status, cash_capital, in_kind_capital, contact_info, 
                    store_url, legal_form, issue_date_gregorian, confirmation_date_gregorian, 
                    has_ecommerce, management_structure, management_managers, cr_capital,
                    city, contact_person, contact_person_number, avg_capital, activities,
                    is_verified, verification_date, admin_notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
                RETURNING user_id`,
                [
                    user_id,
                    finalData.cr_national_number,
                    finalData.cr_number,
                    finalData.trade_name,
                    finalData.address,
                    finalData.sector,
                    finalData.registration_status,
                    finalData.cash_capital,
                    finalData.in_kind_capital,
                    finalData.contact_info ? JSON.stringify(finalData.contact_info) : null,
                    finalData.store_url,
                    finalData.legal_form,
                    finalData.issue_date_gregorian,
                    finalData.confirmation_date_gregorian,
                    finalData.has_ecommerce,
                    finalData.management_structure,
                    finalData.management_managers ? JSON.stringify(Array.isArray(finalData.management_managers) ? finalData.management_managers : finalData.management_managers.split(',').map(item => item.trim()).filter(item => item.length > 0)) : null,
                    finalData.cr_capital,
                    finalData.city,
                    finalData.contact_person,
                    finalData.contact_person_number,
                    finalData.avg_capital,
                    finalData.activities ? (Array.isArray(finalData.activities) ? finalData.activities : finalData.activities.split(',').map(item => item.trim()).filter(item => item.length > 0)) : null,
                    finalData.is_verified,
                    finalData.verification_date,
                    finalData.admin_notes
                ]
            );
            
            console.log(`✅ Created business user record with ID: ${businessUserResult.rows[0].user_id}`);

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Business user created successfully',
                data: {
                    user_id,
                    trade_name: finalData.trade_name,
                    cr_national_number: finalData.cr_national_number,
                    registration_status: finalData.registration_status,
                    wathiq_data_used: !!wathiqData,
                    created_at: new Date().toISOString()
                }
            });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Database transaction failed:', err);
            return NextResponse.json(
                { success: false, error: 'Failed to create business user' },
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
