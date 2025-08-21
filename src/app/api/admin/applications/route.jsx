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

        // Verify admin token
        const decoded = AdminAuth.verifyToken(adminToken);
        if (!decoded) {
            return NextResponse.json({ success: false, error: 'Invalid admin token' }, { status: 401 });
        }

        // Get admin user from database
        const adminUser = await AdminAuth.getAdminById(decoded.admin_id);
        if (!adminUser || !adminUser.is_active) {
            return NextResponse.json({ success: false, error: 'Admin user not found or inactive' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || 'all';
        const sortBy = searchParams.get('sortBy') || 'submitted_at';
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        
        const offset = (page - 1) * limit;

        const client = await pool.connect();
        
        try {
            // Build WHERE clause
            let whereConditions = [];
            let queryParams = [];
            let paramCount = 0;

            if (search) {
                paramCount++;
                whereConditions.push(`(pa.trade_name ILIKE $${paramCount} OR sa.application_id::text ILIKE $${paramCount})`);
                queryParams.push(`%${search}%`);
            }

            if (status !== 'all') {
                paramCount++;
                whereConditions.push(`sa.status = $${paramCount}`);
                queryParams.push(status);
            }

            const whereClause = whereConditions.length > 0 ? `AND ${whereConditions.join(' AND ')}` : '';

            // Count total applications
            const countQuery = `
                SELECT COUNT(*) as total
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                JOIN business_users bu ON sa.business_user_id = bu.user_id
                JOIN users u ON bu.user_id = u.user_id
                LEFT JOIN business_users assigned_bu ON sa.assigned_user_id = assigned_bu.user_id
                LEFT JOIN users assigned_u ON assigned_bu.user_id = assigned_u.user_id
                WHERE 1=1 ${whereClause}
            `;
            
            const countResult = await client.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].total);

            // Build the main query
            const query = `
                SELECT 
                    sa.id,
                    sa.application_id,
                    sa.application_type,
                    sa.business_user_id,
                    sa.assigned_user_id,
                    sa.status,
                    sa.revenue_collected,
                    sa.offers_count,
                    sa.admin_notes,
                    sa.priority_level,
                    sa.submitted_at,
                    sa.auction_end_time,
                    sa.offer_selection_end_time,
                    pa.trade_name,
                    pa.cr_number,
                    pa.city,
                    pa.contact_person,
                    pa.contact_person_number,
                    pa.notes,
                    bu.trade_name as business_trade_name,
                    u.email as business_email,
                    assigned_bu.trade_name as assigned_trade_name,
                    assigned_u.email as assigned_email
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                JOIN business_users bu ON sa.business_user_id = bu.user_id
                JOIN users u ON bu.user_id = u.user_id
                LEFT JOIN business_users assigned_bu ON sa.assigned_user_id = assigned_bu.user_id
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

        // Verify admin token
        const decoded = AdminAuth.verifyToken(adminToken);
        if (!decoded) {
            return NextResponse.json({ success: false, error: 'Invalid admin token' }, { status: 401 });
        }

        // Get admin user from database
        const adminUser = await AdminAuth.getAdminById(decoded.admin_id);
        if (!adminUser || !adminUser.is_active) {
            return NextResponse.json({ success: false, error: 'Admin user not found or inactive' }, { status: 401 });
        }

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
            notes,
            assigned_user_id
        } = body;

        // Validate required fields
        if (!trade_name || !cr_number || !city) {
            return NextResponse.json(
                { success: false, error: 'Trade name, CR number, and city are required' },
                { status: 400 }
            )
        }

        // Validate assigned user if provided
        if (assigned_user_id) {
            const assignedUserCheck = await pool.query(
                'SELECT user_id FROM business_users WHERE user_id = $1',
                [assigned_user_id]
            )
            if (assignedUserCheck.rows.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'Invalid assigned user ID' },
                    { status: 400 }
                )
            }
        }

        // Clean up date fields - convert empty strings to null
        const cleanIssueDate = issue_date === '' ? null : issue_date

        const client = await pool.connect();
        
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

            // Create POS application
            const posApplicationQuery = `
                INSERT INTO pos_application (
                    user_id, status, trade_name, cr_number, cr_national_number, legal_form,
                    registration_status, issue_date, city, activities, contact_info,
                    has_ecommerce, store_url, cr_capital, cash_capital, management_structure,
                    management_names, contact_person, contact_person_number,
                    number_of_pos_devices, city_of_operation, own_pos_system, notes
                ) VALUES (
                    $1, 'submitted', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
                ) RETURNING application_id
            `;
            
            const posApplicationResult = await client.query(posApplicationQuery, [
                userId, trade_name, cr_number, cr_national_number, legal_form,
                registration_status, cleanIssueDate, city, JSON.stringify(activities || []),
                JSON.stringify(contact_info || {}), has_ecommerce, store_url, cr_capital,
                cash_capital, management_structure, JSON.stringify(management_names || []),
                contact_person, contact_person_number, number_of_pos_devices,
                city_of_operation, own_pos_system, notes
            ]);
            
            const applicationId = posApplicationResult.rows[0].application_id;

            // Create submitted application
            const submittedApplicationQuery = `
                INSERT INTO submitted_applications (
                    application_id, application_type, business_user_id, status, submitted_at, assigned_user_id
                ) VALUES ($1, 'pos', $2, 'submitted', NOW(), $3)
                RETURNING id
            `;
            
            await client.query(submittedApplicationQuery, [applicationId, userId, assigned_user_id]);

            // Log the application creation
            await client.query(
                `INSERT INTO admin_audit_log (action, table_name, record_id, admin_user_id, details, timestamp)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                ['CREATE', 'pos_application', applicationId, adminUser.admin_id, JSON.stringify(body)]
            );

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Application created successfully',
                data: {
                    application_id: applicationId,
                    business_user_id: userId,
                    trade_name,
                    status: 'submitted',
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