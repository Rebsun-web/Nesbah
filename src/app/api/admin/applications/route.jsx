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

        const client = await pool.connectWithRetry();
        
        try {
            // Build WHERE clause
            let whereConditions = [];
            let queryParams = [];
            let paramCount = 0;

            if (search) {
                paramCount++;
                whereConditions.push(`(pa.trade_name ILIKE $${paramCount} OR pa.application_id::text ILIKE $${paramCount})`);
                queryParams.push(`%${search}%`);
            }

            if (status !== 'all') {
                paramCount++;
                whereConditions.push(`COALESCE(pa.current_application_status, pa.status) = $${paramCount}`);
                queryParams.push(status);
            }

            const whereClause = whereConditions.length > 0 ? `AND ${whereConditions.join(' AND ')}` : '';

            // Count total applications
            const countQuery = `
                SELECT COUNT(DISTINCT pa.application_id) as total
                FROM pos_application pa
                JOIN business_users bu ON pa.business_user_id = bu.user_id
                JOIN users u ON bu.user_id = u.user_id
                WHERE 1=1 ${whereClause}
            `;
            
            const countResult = await client.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].total);

            // Build the main query - simplified to use only pos_application
            const query = `
                SELECT DISTINCT
                    pa.application_id,
                    pa.business_user_id,
                    COALESCE(pa.current_application_status, pa.status) as status,
                    pa.revenue_collected,
                    pa.offers_count,
                    pa.admin_notes,
                    pa.submitted_at,
                    pa.auction_end_time,
                    pa.offer_selection_end_time,
                    pa.trade_name,
                    pa.cr_number,
                    pa.city,
                    pa.contact_person,
                    pa.contact_person_number,
                    pa.notes,
                    pa.opened_by,
                    pa.purchased_by,
                    pa.assigned_user_id,
                    bu.trade_name as business_trade_name,
                    u.email as business_email,
                    array_length(pa.opened_by, 1) as opened_count,
                    array_length(pa.purchased_by, 1) as purchased_count,
                    -- Assigned user information (if assigned to a bank)
                    assigned_u.entity_name as assigned_trade_name,
                    assigned_u.email as assigned_email,
                    assigned_bu.logo_url as assigned_logo_url,
                    assigned_u.user_type as assigned_user_type
                FROM pos_application pa
                JOIN business_users bu ON pa.business_user_id = bu.user_id
                JOIN users u ON bu.user_id = u.user_id
                LEFT JOIN bank_users assigned_bu ON pa.assigned_user_id = assigned_bu.user_id
                LEFT JOIN users assigned_u ON assigned_bu.user_id = assigned_u.user_id
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

// POST - Create new application
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
            trade_name,
            cr_number,
            cr_national_number,
            legal_form,
            registration_status,
            issue_date,
            city,
            activities,
            contact_info,
            has_ecommerce,
            store_url,
            cr_capital,
            cash_capital,
            management_structure,
            management_names,
            contact_person,
            contact_person_number,
            number_of_pos_devices,
            city_of_operation,
            own_pos_system,
            notes
        } = body;

        // Validate required fields
        if (!trade_name || !cr_number || !city) {
            return NextResponse.json(
                { success: false, error: 'Trade name, CR number, and city are required' },
                { status: 400 }
            )
        }



        // Clean up date fields - convert empty strings to null
        const cleanIssueDate = issue_date === '' ? null : issue_date

        const client = await pool.connectWithRetry();
        
        try {
            await client.query('BEGIN');

            // Create user first
            const userQuery = `
                INSERT INTO users (email, password, user_type, entity_name, created_at, updated_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
                RETURNING user_id
            `;
            
            const businessEmail = `${cr_number.toLowerCase().replace(/\s+/g, '')}@nesbah.com`;
            const defaultPassword = 'changeme123'; // This should be hashed in production
            const userResult = await client.query(userQuery, [
                businessEmail,
                defaultPassword,
                'business_user',
                trade_name
            ]);
            
            const userId = userResult.rows[0].user_id;

            // Generate unique cr_national_number if not provided or if it already exists
            let uniqueCrNationalNumber = cr_national_number || cr_number;
            if (!uniqueCrNationalNumber) {
                uniqueCrNationalNumber = `CR${Date.now()}`;
            } else {
                // Check if it already exists and make it unique
                const existingCheck = await client.query(
                    'SELECT cr_national_number FROM business_users WHERE cr_national_number = $1',
                    [uniqueCrNationalNumber]
                );
                if (existingCheck.rows.length > 0) {
                    uniqueCrNationalNumber = `${uniqueCrNationalNumber}_${Date.now()}`;
                }
            }

            // Create business user
            const businessUserQuery = `
                INSERT INTO business_users (
                    user_id, cr_national_number, trade_name, address, sector, 
                    cr_capital, registration_status, cr_number, contact_info, 
                    store_url, cash_capital, has_ecommerce, management_structure, 
                    city, activities
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING user_id
            `;
            
            const businessUserResult = await client.query(businessUserQuery, [
                userId,
                uniqueCrNationalNumber,
                trade_name,
                city, // Use city as address
                'retail', // Default sector
                cr_capital,
                registration_status || 'active',
                cr_number,
                JSON.stringify(contact_info || {}),
                store_url,
                cash_capital,
                has_ecommerce,
                management_structure,
                city,
                activities ? (Array.isArray(activities) ? activities : [activities]) : []
            ]);
            
            const businessUserId = businessUserResult.rows[0].user_id;

            // Create POS application with all consolidated fields
            const posApplicationQuery = `
                INSERT INTO pos_application (
                    user_id, business_user_id, status, current_application_status,
                    trade_name, cr_number, cr_national_number, legal_form,
                    registration_status, issue_date, city, activities, contact_info,
                    has_ecommerce, store_url, cr_capital, cash_capital, management_structure,
                    management_names, contact_person, contact_person_number,
                    number_of_pos_devices, city_of_operation, own_pos_system, notes,
                    revenue_collected, offers_count, opened_by, purchased_by
                ) VALUES (
                    $1, $2, 'submitted', 'live_auction', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
                ) RETURNING application_id
            `;
            
            const posApplicationResult = await client.query(posApplicationQuery, [
                userId, businessUserId, trade_name, cr_number, uniqueCrNationalNumber, legal_form,
                registration_status, cleanIssueDate, city, JSON.stringify(activities || []),
                JSON.stringify(contact_info || {}), has_ecommerce, store_url, cr_capital,
                cash_capital, management_structure, JSON.stringify(management_names || []),
                contact_person, contact_person_number, number_of_pos_devices,
                city_of_operation, own_pos_system, notes, 0, 0, '{}', '{}'
            ]);
            
            const applicationId = posApplicationResult.rows[0].application_id;

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Application created successfully',
                data: {
                    application_id: applicationId,
                    business_user_id: userId,
                    trade_name,
                    status: 'live_auction',
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