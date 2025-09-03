import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

// GET - List applications with filtering, sorting, and pagination
export async function GET(req) {
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

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || 'all';
        const sortBy = searchParams.get('sortBy') || 'submitted_at';
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        
        const offset = (page - 1) * limit;

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_applications_route.jsx_route');
        
        try {
            // Build WHERE clause
            let whereConditions = [];
            let queryParams = [];
            let paramCount = 0;

            if (search) {
                paramCount++;
                whereConditions.push(`(pa.trade_name ILIKE $${paramCount} OR pa.application_id::text ILIKE $${paramCount} OR pa.cr_number ILIKE $${paramCount})`);
                queryParams.push(`%${search}%`);
            }

            if (status !== 'all') {
                paramCount++;
                whereConditions.push(`(
                    CASE 
                        WHEN pa.auction_end_time < NOW() AND pa.offers_count > 0 THEN 'completed'
                        WHEN pa.auction_end_time < NOW() AND pa.offers_count = 0 THEN 'ignored'
                        ELSE 'live_auction'
                    END
                ) = $${paramCount}`);
                queryParams.push(status);
            }

            const whereClause = whereConditions.length > 0 ? `AND ${whereConditions.join(' AND ')}` : '';

            // Count total applications
            const countQuery = `
                SELECT COUNT(DISTINCT pa.application_id) as total
                FROM pos_application pa
                WHERE 1=1 ${whereClause}
            `;
            
            const countResult = await client.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].total);

            // Build the main query - using EXACT same structure as business-bank actions
            const query = `
                SELECT 
                    pa.application_id,
                    pa.user_id,
                    pa.status,
                    pa.submitted_at,
                    pa.auction_end_time,
                    pa.notes,
                    pa.uploaded_document,
                    pa.uploaded_filename,
                    pa.uploaded_mimetype,
                    pa.own_pos_system,
                    pa.contact_person,
                    pa.contact_person_number,
                    pa.number_of_pos_devices,
                    pa.city_of_operation,
                    pa.pos_provider_name,
                    pa.pos_age_duration_months,
                    pa.avg_monthly_pos_sales,
                    pa.requested_financing_amount,
                    pa.preferred_repayment_period_months,
                    pa.trade_name,
                    pa.cr_number,
                    pa.cr_national_number,
                    pa.legal_form,
                    pa.registration_status,
                    pa.issue_date_gregorian,
                    pa.city,
                    pa.has_ecommerce,
                    pa.store_url,
                    pa.cr_capital,
                    pa.cash_capital,
                    pa.management_structure,
                    pa.offers_count,
                    pa.revenue_collected,
                    pa.opened_by,
                    pa.purchased_by,
                    -- Business user information
                    bu.cr_national_number as business_cr_national_number,
                    bu.legal_form as business_legal_form,
                    bu.registration_status as business_registration_status,
                    bu.headquarter_city_name,
                    bu.confirmation_date_gregorian,
                    bu.contact_info,
                    bu.activities,
                    bu.in_kind_capital,
                    bu.avg_capital,
                    bu.headquarter_district_name,
                    bu.headquarter_street_name,
                    bu.headquarter_building_number,
                    bu.sector,
                    bu.management_managers,
                    bu.is_verified,
                    bu.verification_date,
                    -- User information
                    u.email as business_email,
                    u.account_status as user_account_status,
                    u.created_at as user_created_at,
                    u.updated_at as user_updated_at,
                    -- Calculated status using the correct logic
                    CASE 
                        WHEN pa.auction_end_time < NOW() AND pa.offers_count > 0 THEN 'completed'
                        WHEN pa.auction_end_time < NOW() AND pa.offers_count = 0 THEN 'ignored'
                        ELSE 'live_auction'
                    END as calculated_status,
                    -- Array counts
                    COALESCE(array_length(pa.opened_by, 1), 0) as opened_count,
                    COALESCE(array_length(pa.purchased_by, 1), 0) as purchased_count,
                    -- Time calculations
                    EXTRACT(EPOCH FROM (pa.auction_end_time - NOW())) / 3600 as hours_remaining
                FROM pos_application pa
                LEFT JOIN business_users bu ON pa.user_id = bu.user_id
                LEFT JOIN users u ON pa.user_id = u.user_id
                WHERE 1=1 ${whereClause}
                ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;
            
            queryParams.push(limit, offset);
            
            console.log('🔍 API Debug - Pagination params:', { page, limit, offset, paramCount })
            console.log('🔍 API Debug - Query params:', queryParams)

            const applicationsResult = await client.query(query, queryParams);
            
            console.log('🔍 API Debug - Total count:', total)
            console.log('🔍 API Debug - Applications result rows:', applicationsResult.rows.length)
            console.log('🔍 API Debug - Applications result:', applicationsResult.rows)

            return NextResponse.json({
                success: true,
                data: {
                    applications: applicationsResult.rows,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                        hasNext: page * limit < total,
                        hasPrev: page > 1
                    }
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Applications list error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch applications' },
            { status: 500 }
        );
    }
}

// POST - Create new application using EXACT same schema as business-bank actions
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
            // Business user data (same as business registration)
            cr_national_number,
            email,
            password,
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
            // POS application data (same as business submission)
            notes,
            uploaded_document,
            uploaded_filename,
            uploaded_mimetype,
            own_pos_system,
            number_of_pos_devices,
            city_of_operation,
            pos_provider_name,
            pos_age_duration_months,
            avg_monthly_pos_sales,
            requested_financing_amount,
            preferred_repayment_period_months
        } = body;

        // Validate required fields (same as business registration)
        if (!cr_national_number || !email || !cr_number || !trade_name) {
            return NextResponse.json(
                { success: false, error: 'CR National Number, email, CR number, and trade name are required' },
                { status: 400 }
            );
        }

        // Validate required POS application fields (same as business submission)
        if (!pos_provider_name || !pos_age_duration_months || 
            !avg_monthly_pos_sales || !requested_financing_amount || 
            !preferred_repayment_period_months) {
            return NextResponse.json(
                { success: false, error: 'POS provider name, age duration, monthly sales, financing amount, and repayment period are required' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_applications_route.jsx_route');
        
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

            // Hash the password (same as business registration)
            const bcrypt = await import('bcrypt');
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password || 'default_password', saltRounds);

            // Insert user record (same as business registration)
            const userRes = await client.query(
                `INSERT INTO users (email, password, user_type, entity_name, account_status, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING user_id`,
                [email, hashedPassword, 'business_user', trade_name, 'active']
            );
            const user_id = userRes.rows[0].user_id;

            // Insert business user data (same as business registration)
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
                    legal_form || 'LLC',
                    registration_status || 'active',
                    headquarter_city_name || city,
                    issue_date_gregorian || new Date().toISOString().split('T')[0],
                    confirmation_date_gregorian || new Date().toISOString().split('T')[0],
                    contact_info ? (typeof contact_info === 'string' ? contact_info : JSON.stringify(contact_info)) : null,
                    activities ? (Array.isArray(activities) ? activities : [activities]) : null,
                    has_ecommerce || false,
                    store_url, 
                    cr_capital || 0,
                    cash_capital || 0,
                    management_structure || 'Standard',
                    management_managers ? (Array.isArray(management_managers) ? management_managers : [management_managers]) : null,
                    address || city, 
                    sector || 'Technology', 
                    in_kind_capital || 0, 
                    avg_capital || 0,
                    headquarter_district_name || 'Central',
                    headquarter_street_name || 'Main Street',
                    headquarter_building_number || '1',
                    city,
                    contact_person || 'Contact Person',
                    contact_person_number || '0500000000',
                    true, // is_verified - admin created
                    new Date().toISOString(), // verification_date
                    new Date().toISOString(), // created_at
                    new Date().toISOString()  // updated_at
                ]
            );

            // Create POS application (same as business submission)
            const submitted_at = new Date();
            const auction_end_time = new Date(submitted_at.getTime() + 48 * 60 * 60 * 1000); // 48 hours from submission

            const posAppResult = await client.query(
                `INSERT INTO pos_application (
                    user_id, status, submitted_at, notes, uploaded_document, own_pos_system, 
                    uploaded_filename, uploaded_mimetype, trade_name, cr_number, cr_national_number, 
                    legal_form, registration_status, issue_date_gregorian, city, 
                    has_ecommerce, store_url, cr_capital, cash_capital, management_structure, 
                    contact_person, contact_person_number, number_of_pos_devices, 
                    city_of_operation, auction_end_time, opened_by, purchased_by,
                    pos_provider_name, pos_age_duration_months, avg_monthly_pos_sales,
                    requested_financing_amount, preferred_repayment_period_months,
                    offers_count, revenue_collected
                ) VALUES (
                    $1, 'live_auction', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
                    $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32
                ) RETURNING application_id
                `,
                [
                    user_id, submitted_at, notes || null,
                    uploaded_document ? Buffer.from(uploaded_document, 'base64') : null,
                    own_pos_system ?? null, uploaded_filename || null, uploaded_mimetype || null,
                    trade_name, cr_number, cr_national_number,
                    legal_form || 'LLC', registration_status || 'active', issue_date_gregorian || new Date().toISOString().split('T')[0],
                    city, has_ecommerce || false,
                    store_url, cr_capital || 0, cash_capital || 0,
                    management_structure || 'Standard',
                    contact_person || 'Contact Person', contact_person_number || '0500000000',
                    number_of_pos_devices || 1, city_of_operation || city, auction_end_time,
                    [], [], // Initialize empty arrays for tracking (same as business submission)
                    pos_provider_name, pos_age_duration_months, avg_monthly_pos_sales,
                    requested_financing_amount, preferred_repayment_period_months,
                    0, 0 // Initialize offers_count and revenue_collected
                ]
            );

            const application_id = posAppResult.rows[0].application_id;

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Business user and application created successfully',
                data: {
                    user_id,
                    application_id,
                    email,
                    trade_name,
                    cr_national_number,
                    status: 'live_auction',
                    auction_end_time,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Application creation error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create application' },
            { status: 500 }
        );
    }
}