import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';
import { STATUS_CALCULATION_SQL, STATUS_FILTER_SQL } from '@/lib/application-status';
import { auctionConfig } from '@/lib/config/auction-config';

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
        const financingType = searchParams.get('financing_type') || 'all';
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
                whereConditions.push(`(${STATUS_FILTER_SQL}) = $${paramCount}`);
                queryParams.push(status);
            }

            if (financingType !== 'all') {
                paramCount++;
                whereConditions.push(`pa.financing_type = $${paramCount}`);
                queryParams.push(financingType);
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
                    pa.financing_type,
                    pa.approximate_financing_amount,
                    pa.business_contact_email,
                    pa.reference_number,
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
                    COALESCE(pa.sector, bu.sector) as sector,
                    bu.management_managers,
                    bu.is_verified,
                    bu.verification_date,
                    -- User information
                    u.email as business_email,
                    u.account_status as user_account_status,
                    u.created_at as user_created_at,
                    u.updated_at as user_updated_at,
                    -- Calculated status using standardized logic
                    ${STATUS_CALCULATION_SQL},
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
            
            const applicationsResult = await client.query(query, queryParams);

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
            contact_email,
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

        // Validate required fields - only CR number needed for lookup
        if (!cr_national_number) {
            return NextResponse.json(
                { success: false, error: 'CR National Number is required to find existing business user' },
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

            // Check if business user already exists and get their data
            const existingBusinessUser = await client.query(
                `SELECT bu.*, u.email 
                 FROM business_users bu 
                 JOIN users u ON bu.user_id = u.user_id 
                 WHERE bu.cr_national_number = $1`,
                [cr_national_number]
            );

            if (existingBusinessUser.rowCount === 0) {
                return NextResponse.json(
                    { success: false, error: 'Business user with this CR number does not exist. Please register the business user first.' },
                    { status: 404 }
                );
            }

            const user_id = existingBusinessUser.rows[0].user_id;
            const businessUserData = existingBusinessUser.rows[0];

            // Create POS application (same as business submission)
            const submitted_at = new Date();
            const auction_end_time = new Date(submitted_at.getTime() + auctionConfig.durationMilliseconds); // Configured duration from submission

            const posAppResult = await client.query(
                `INSERT INTO pos_application (
                    user_id, status, submitted_at, notes, uploaded_document, own_pos_system, 
                    uploaded_filename, uploaded_mimetype, trade_name, cr_number, cr_national_number, 
                    legal_form, registration_status, issue_date_gregorian, city, 
                    has_ecommerce, store_url, cr_capital, cash_capital, management_structure, 
                    contact_person, contact_person_number, number_of_pos_devices, 
                    city_of_operation, auction_end_time, opened_by, purchased_by,
                    pos_provider_name, pos_age_duration_months, avg_monthly_pos_sales,
                    requested_financing_amount, preferred_repayment_period_months
                ) VALUES (
                    $1, 'live_auction', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
                    $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
                ) RETURNING application_id
                `,
                [
                    user_id, submitted_at, notes || null,
                    uploaded_document ? Buffer.from(uploaded_document, 'base64') : null,
                    own_pos_system ?? null, uploaded_filename || null, uploaded_mimetype || null,
                    // Use existing business user data instead of form data
                    businessUserData.trade_name, businessUserData.cr_number, businessUserData.cr_national_number,
                    businessUserData.legal_form, businessUserData.registration_status, businessUserData.issue_date_gregorian,
                    businessUserData.city, businessUserData.has_ecommerce,
                    businessUserData.store_url, businessUserData.cr_capital, businessUserData.cash_capital,
                    businessUserData.management_structure,
                    contact_person || businessUserData.contact_person, contact_person_number || businessUserData.contact_person_number,
                    number_of_pos_devices || 1, city_of_operation || businessUserData.city, auction_end_time,
                    '{}', '{}', // Initialize empty arrays for tracking
                    // Use form data for POS-specific fields
                    pos_provider_name, pos_age_duration_months, avg_monthly_pos_sales,
                    requested_financing_amount, preferred_repayment_period_months
                ]
            );

            const application_id = posAppResult.rows[0].application_id;

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Application created successfully using existing business user data',
                data: {
                    user_id,
                    application_id,
                    email: businessUserData.email,
                    trade_name: businessUserData.trade_name,
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