import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateAPIRequest } from '@/lib/auth/api-auth';
import AdminAuth from '@/lib/auth/admin-auth';

export async function GET(req) {
    try {
        // Authenticate the request
        const authResult = await authenticateAPIRequest(req, 'admin_user');
        if (!authResult.success) {
            return NextResponse.json(
                { success: false, error: authResult.error },
                { status: authResult.status || 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const user_type = searchParams.get('user_type'); // 'business', 'individual', 'bank'
        const registration_status = searchParams.get('registration_status');
        const offer_status = searchParams.get('offer_status'); // 'has_offers', 'no_offers'
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit')) || 50;
        const offset = parseInt(searchParams.get('offset')) || 0;

        let client;
        try {
            client = await pool.connectWithRetry();
            
            let query = '';
            const queryParams = [];
            let paramCount = 0;

            // Build query based on user type
            if (user_type === 'business') {
                query = `
                    SELECT 
                        bu.user_id,
                        u.email,
                        bu.trade_name as entity_name,
                        bu.registration_status,
                        u.created_at,
                        u.updated_at,
                        'business' as user_type,
                        CASE WHEN COUNT(pa.application_id) > 0 THEN true ELSE false END as has_sent_application,
                        MAX(pa.submitted_at) as last_application_date,
                        false as has_sent_offer,
                        0::bigint as total_offers_sent,
                        NULL::timestamp as last_offer_date
                    FROM business_users bu
                    JOIN users u ON bu.user_id = u.user_id
                    LEFT JOIN pos_application pa ON bu.user_id = pa.user_id
                    WHERE 1=1
                    GROUP BY bu.user_id, u.email, bu.trade_name, bu.registration_status, u.created_at, u.updated_at
                `;
            } else if (user_type === 'individual') {
                query = `
                    SELECT 
                        u.user_id,
                        u.email,
                        u.entity_name,
                        u.account_status as registration_status,
                        u.created_at,
                        u.updated_at,
                        'individual' as user_type,
                        false as has_sent_application,
                        NULL::timestamp as last_application_date,
                        false as has_sent_offer,
                        0::bigint as total_offers_sent,
                        NULL::timestamp as last_offer_date
                    FROM users u
                    WHERE u.user_type = 'individual_user'
                `;
            } else if (user_type === 'bank') {
                let bankQuery = `
                    SELECT 
                        u.user_id,
                        u.email,
                        u.entity_name,
                        u.account_status as registration_status,
                        u.created_at,
                        u.updated_at,
                        'bank' as user_type,
                        false as has_sent_application,
                        NULL::timestamp as last_application_date,
                        CASE WHEN COUNT(ao.offer_id) > 0 THEN true ELSE false END as has_sent_offer,
                        COUNT(ao.offer_id)::bigint as total_offers_sent,
                        MAX(ao.submitted_at) as last_offer_date,
                        bu.logo_url
                    FROM users u
                    LEFT JOIN bank_users bu ON u.user_id = bu.user_id
                    LEFT JOIN application_offers ao ON u.user_id = ao.bank_user_id
                    WHERE u.user_type = 'bank_user'
                    GROUP BY u.user_id, u.email, u.entity_name, u.account_status, u.created_at, u.updated_at, bu.logo_url
                `;
                
                // Add offer status filter for bank users
                if (offer_status === 'has_offers') {
                    bankQuery += ` HAVING COUNT(ao.offer_id) > 0`;
                } else if (offer_status === 'no_offers') {
                    bankQuery += ` HAVING COUNT(ao.offer_id) = 0`;
                }
                
                query = bankQuery;
            } else {
                // Get all users
                query = `
                    SELECT 
                        bu.user_id,
                        u.email,
                        bu.trade_name as entity_name,
                        bu.registration_status,
                        u.created_at,
                        u.updated_at,
                        'business' as user_type,
                        CASE WHEN COUNT(pa.application_id) > 0 THEN true ELSE false END as has_sent_application,
                        MAX(pa.submitted_at) as last_application_date,
                        false as has_sent_offer,
                        0::bigint as total_offers_sent,
                        NULL::timestamp as last_offer_date
                    FROM business_users bu
                    JOIN users u ON bu.user_id = u.user_id
                    LEFT JOIN pos_application pa ON bu.user_id = pa.user_id
                    GROUP BY bu.user_id, u.email, bu.trade_name, bu.registration_status, u.created_at, u.updated_at
                    
                    UNION ALL
                    
                    SELECT 
                        u.user_id,
                        u.email,
                        u.entity_name,
                        u.account_status as registration_status,
                        u.created_at,
                        u.updated_at,
                        'individual' as user_type,
                        false as has_sent_application,
                        NULL::timestamp as last_application_date,
                        false as has_sent_offer,
                        0::bigint as total_offers_sent,
                        NULL::timestamp as last_offer_date
                    FROM users u
                    WHERE u.user_type = 'individual_user'
                    
                    UNION ALL
                    
                    SELECT 
                        u.user_id,
                        u.email,
                        u.entity_name,
                        u.account_status as registration_status,
                        u.created_at,
                        u.updated_at,
                        'bank' as user_type,
                        false as has_sent_application,
                        NULL::timestamp as last_application_date,
                        CASE WHEN COUNT(ao.offer_id) > 0 THEN true ELSE false END as has_sent_offer,
                        COUNT(ao.offer_id)::bigint as total_offers_sent,
                        MAX(ao.submitted_at) as last_offer_date
                    FROM users u
                    LEFT JOIN application_offers ao ON u.user_id = ao.bank_user_id
                    WHERE u.user_type = 'bank_user'
                    GROUP BY u.user_id, u.email, u.entity_name, u.account_status, u.created_at, u.updated_at
                `;
            }

            // Add filters
            if (registration_status) {
                paramCount++;
                if (user_type === 'business') {
                    query += ` AND bu.registration_status = $${paramCount}`;
                } else if (user_type === 'individual') {
                    query += ` AND u.account_status = $${paramCount}`;
                } else if (user_type === 'bank') {
                    query += ` AND u.account_status = $${paramCount}`;
                } else {
                    // For all users, we need to handle this differently since we're using UNION
                    // This is a simplified approach - in production you might want to use a more sophisticated filter
                    query += ` AND registration_status = $${paramCount}`;
                }
                queryParams.push(registration_status);
            }

            if (search) {
                paramCount++;
                if (user_type === 'business') {
                    query += ` AND (bu.trade_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR bu.cr_number ILIKE $${paramCount})`;
                } else if (user_type === 'individual') {
                    query += ` AND (u.entity_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
                } else if (user_type === 'bank') {
                    query += ` AND (u.entity_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
                } else {
                    // For all users, we need to handle search differently since we're using UNION
                    // This is a simplified approach - in production you might want to use a more sophisticated search
                    query += ` AND (entity_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
                }
                queryParams.push(`%${search}%`);
            }

            // Add ordering and pagination
            // No need to add GROUP BY since it's already in the main queries where needed
            
            query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            queryParams.push(limit, offset);

            const result = await client.query(query, queryParams);

            // Get total count for pagination
            let countQuery = '';
            if (user_type === 'business') {
                countQuery = 'SELECT COUNT(*) as total FROM business_users bu JOIN users u ON bu.user_id = u.user_id WHERE 1=1';
            } else if (user_type === 'individual') {
                countQuery = 'SELECT COUNT(*) as total FROM users u WHERE u.user_type = \'individual_user\'';
            } else if (user_type === 'bank') {
                countQuery = 'SELECT COUNT(*) as total FROM users u WHERE u.user_type = \'bank_user\'';
            } else {
                countQuery = `
                    SELECT (
                        (SELECT COUNT(*) FROM business_users bu JOIN users u ON bu.user_id = u.user_id) +
                        (SELECT COUNT(*) FROM users u WHERE u.user_type = 'individual_user') +
                        (SELECT COUNT(*) FROM users u WHERE u.user_type = 'bank_user')
                    ) as total
                `;
            }

            if (registration_status && user_type) {
                if (user_type === 'business') {
                    countQuery += ` AND bu.registration_status = $1`;
                } else if (user_type === 'individual' || user_type === 'bank') {
                    countQuery += ` AND u.account_status = $1`;
                }
            }

            if (search && user_type) {
                const searchParam = user_type === 'business' ? 2 : 2;
                if (user_type === 'business') {
                    countQuery += ` AND (bu.trade_name ILIKE $${searchParam} OR u.email ILIKE $${searchParam} OR bu.cr_number ILIKE $${searchParam})`;
                } else if (user_type === 'individual') {
                    countQuery += ` AND (u.entity_name ILIKE $${searchParam} OR u.email ILIKE $${searchParam})`;
                } else if (user_type === 'bank') {
                    countQuery += ` AND (u.entity_name ILIKE $${searchParam} OR u.email ILIKE $${searchParam})`;
                }
            }

            const countParams = [];
            if (registration_status) countParams.push(registration_status);
            if (search) countParams.push(`%${search}%`);
            const countResult = await client.query(countQuery, countParams);
            const total = parseInt(countResult.rows[0].total);

            return NextResponse.json({
                success: true,
                data: {
                    users: result.rows,
                    pagination: {
                        total,
                        limit,
                        offset,
                        has_more: offset + limit < total
                    }
                }
            });

        } finally {
            if (client) {
                client.release();
            }
        }

    } catch (error) {
        console.error('Admin users list error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

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
            user_type,
            email,
            entity_name,
            first_name,
            last_name,
            registration_status = 'active'
        } = body;
        
        const admin_user_id = adminUser.admin_id;

        // Validate required fields
        if (!user_type || !email) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: user_type, email' },
                { status: 400 }
            );
        }

        if (!['business', 'individual', 'bank'].includes(user_type)) {
            return NextResponse.json(
                { success: false, error: 'user_type must be one of: business, individual, bank' },
                { status: 400 }
            );
        }

        let client;
        try {
            client = await pool.connectWithRetry();
            
            await client.query('BEGIN');

            // First create the user record
            const userResult = await client.query(
                `INSERT INTO users (email, password, user_type, entity_name, account_status, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                 RETURNING user_id`,
                [email, 'default_password', `${user_type}_user`, entity_name || `${first_name} ${last_name}`.trim(), registration_status]
            );
            
            const userId = userResult.rows[0].user_id;

            // Then create the specific user record
            if (user_type === 'business') {
                if (!entity_name) {
                    await client.query('ROLLBACK');
                    return NextResponse.json(
                        { success: false, error: 'entity_name is required for business users' },
                        { status: 400 }
                    );
                }

                await client.query(
                    `INSERT INTO business_users 
                        (user_id, cr_national_number, trade_name, address, sector, registration_status)
                    VALUES ($1, $2, $3, $4, $5, $6)`,
                    [userId, `CR${Date.now()}`, entity_name, 'Default Address', 'Technology', registration_status]
                );
            } else if (user_type === 'individual') {
                if (!first_name || !last_name) {
                    await client.query('ROLLBACK');
                    return NextResponse.json(
                        { success: false, error: 'first_name and last_name are required for individual users' },
                        { status: 400 }
                    );
                }

                await client.query(
                    `INSERT INTO individual_users 
                        (national_id, first_name, last_name)
                    VALUES ($1, $2, $3)`,
                    [`ID${Date.now()}`, first_name, last_name]
                );
            } else if (user_type === 'bank') {
                if (!entity_name) {
                    await client.query('ROLLBACK');
                    return NextResponse.json(
                        { success: false, error: 'entity_name is required for bank users' },
                        { status: 400 }
                    );
                }

                await client.query(
                    `INSERT INTO bank_users 
                        (user_id, email, credit_limit)
                    VALUES ($1, $2, $3)`,
                    [userId, email, 10000.00]
                );
            }

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: `${user_type} user created successfully`,
                data: {
                    user_id: userId,
                    user_type,
                    email,
                    registration_status,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            if (client) {
                await client.query('ROLLBACK');
            }
            throw error;
        } finally {
            if (client) {
                client.release();
            }
        }

    } catch (error) {
        console.error('Admin user creation error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create user' },
            { status: 500 }
        );
    }
}
