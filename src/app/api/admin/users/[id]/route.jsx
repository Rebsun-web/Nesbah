import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

// GET - Get user by ID
export async function GET(req, { params }) {
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

        const { id } = params;
        const { searchParams } = new URL(req.url);
        const user_type = searchParams.get('user_type') || 'business';

        const client = await pool.connectWithRetry();
        
        try {
            let query;
            let queryParams = [id];

            if (user_type === 'business') {
                query = `
                    SELECT 
                        bu.user_id,
                        u.email,
                        bu.trade_name as entity_name,
                        bu.cr_national_number,
                        bu.cr_number,
                        bu.registration_status,
                        bu.address,
                        bu.sector,
                        bu.city,
                        bu.cr_capital,
                        bu.cash_capital,
                        bu.in_kind_capital,
                        bu.contact_person,
                        bu.contact_person_number,
                        bu.contact_info,
                        bu.store_url,
                        bu.legal_form,
                        bu.issue_date_gregorian,
                        bu.confirmation_date_gregorian,
                        bu.has_ecommerce,
                        bu.management_structure,
                        bu.management_managers,
                        bu.created_at,
                        bu.updated_at,
                        'business' as user_type,
                        CASE WHEN COUNT(pa.application_id) > 0 THEN true ELSE false END as has_sent_application,
                        MAX(pa.submitted_at) as last_application_date
                    FROM business_users bu
                    JOIN users u ON bu.user_id = u.user_id
                    LEFT JOIN pos_application pa ON bu.user_id = pa.user_id
                    WHERE bu.user_id = $1
                    GROUP BY bu.user_id, u.email, bu.trade_name, bu.cr_national_number, bu.cr_number, 
                             bu.registration_status, bu.address, bu.sector, bu.city, bu.cr_capital, 
                             bu.cash_capital, bu.in_kind_capital, bu.contact_person, bu.contact_person_number,
                             bu.contact_info, bu.store_url, bu.legal_form, bu.issue_date_gregorian, 
                             bu.confirmation_date_gregorian, bu.has_ecommerce, bu.management_structure, 
                             bu.management_managers, bu.created_at, bu.updated_at
                `;
            } else if (user_type === 'individual') {
                query = `
                    SELECT 
                        iu.user_id,
                        iu.email,
                        iu.first_name,
                        iu.last_name,
                        iu.first_name || ' ' || iu.last_name as entity_name,
                        iu.national_id,
                        iu.registration_status,
                        iu.city,
                        iu.contact_number,
                        iu.created_at,
                        iu.updated_at,
                        'individual' as user_type,
                        false as has_sent_application,
                        NULL as last_application_date
                    FROM individual_users iu
                    WHERE iu.user_id = $1
                `;
            } else if (user_type === 'bank') {
                query = `
                    SELECT 
                        bu.user_id,
                        bu.email,
                        u.entity_name,
                        u.account_status as registration_status,
                        bu.credit_limit,
                        bu.contact_person,
                        bu.contact_person_number,
                        bu.created_at,
                        bu.updated_at,
                        'bank' as user_type,
                        false as has_sent_application,
                        NULL as last_application_date
                    FROM bank_users bu
                    JOIN users u ON bu.user_id = u.user_id
                    WHERE bu.user_id = $1
                `;
            } else {
                return NextResponse.json(
                    { success: false, error: 'Invalid user_type parameter' },
                    { status: 400 }
                );
            }

            const result = await client.query(query, queryParams);

            if (result.rows.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'User not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                data: result.rows[0]
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Get user by ID error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch user' },
            { status: 500 }
        );
    }
}

// PUT - Update user
export async function PUT(req, { params }) {
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

        const { id } = params;
        const body = await req.json();
        const { user_type, ...updateData } = body;

        if (!user_type) {
            return NextResponse.json(
                { success: false, error: 'user_type is required' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry();
        
        try {
            await client.query('BEGIN');

            let updateQuery;
            let updateParams = [];
            let paramCount = 0;

            if (user_type === 'business') {
                const allowedFields = [
                    'trade_name', 'cr_number', 'registration_status', 'city', 
                    'cr_capital', 'contact_person', 'contact_person_number'
                ];
                
                const setClauses = [];
                for (const [key, value] of Object.entries(updateData)) {
                    if (allowedFields.includes(key) && value !== undefined && value !== '') {
                        paramCount++;
                        setClauses.push(`${key} = $${paramCount}`);
                        // Convert empty strings to null for numeric fields
                        if (key === 'cr_capital' && (value === '' || value === null)) {
                            updateParams.push(null);
                        } else if (key === 'contact_person_number' && (value === '' || value === null)) {
                            updateParams.push(null);
                        } else {
                            updateParams.push(value);
                        }
                    }
                }

                if (setClauses.length === 0) {
                    await client.query('ROLLBACK');
                    return NextResponse.json(
                        { success: false, error: 'No valid fields to update' },
                        { status: 400 }
                    );
                }

                updateParams.push(id);

                updateQuery = `
                    UPDATE business_users 
                    SET ${setClauses.join(', ')}
                    WHERE user_id = $${paramCount + 1}
                    RETURNING user_id, trade_name as entity_name, registration_status
                `;
            } else if (user_type === 'individual') {
                const allowedFields = [
                    'first_name', 'last_name', 'national_id', 'registration_status', 
                    'city', 'contact_number'
                ];
                
                const setClauses = [];
                for (const [key, value] of Object.entries(updateData)) {
                    if (allowedFields.includes(key) && value !== undefined && value !== '') {
                        paramCount++;
                        setClauses.push(`${key} = $${paramCount}`);
                        updateParams.push(value);
                    }
                }

                if (setClauses.length === 0) {
                    await client.query('ROLLBACK');
                    return NextResponse.json(
                        { success: false, error: 'No valid fields to update' },
                        { status: 400 }
                    );
                }

                updateParams.push(id);

                updateQuery = `
                    UPDATE individual_users 
                    SET ${setClauses.join(', ')}
                    WHERE national_id = $${paramCount + 1}
                    RETURNING national_id, first_name, last_name
                `;
            } else if (user_type === 'bank') {
                const allowedFields = [
                    'entity_name', 'registration_status', 'contact_person', 'contact_person_number'
                ];
                
                const setClauses = [];
                for (const [key, value] of Object.entries(updateData)) {
                    if (allowedFields.includes(key) && value !== undefined && value !== '') {
                        paramCount++;
                        setClauses.push(`${key} = $${paramCount}`);
                        updateParams.push(value);
                    }
                }

                if (setClauses.length === 0) {
                    await client.query('ROLLBACK');
                    return NextResponse.json(
                        { success: false, error: 'No valid fields to update' },
                        { status: 400 }
                    );
                }

                updateParams.push(id);

                updateQuery = `
                    UPDATE bank_users 
                    SET ${setClauses.join(', ')}
                    WHERE user_id = $${paramCount + 1}
                    RETURNING user_id, email, credit_limit
                `;
            } else {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'Invalid user_type' },
                    { status: 400 }
                );
            }

            const result = await client.query(updateQuery, updateParams);

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'User not found' },
                    { status: 404 }
                );
            }

            // Log the update
            await client.query(
                `
                INSERT INTO admin_audit_log 
                    (action, table_name, record_id, admin_user_id, details, timestamp)
                VALUES ($1, $2, $3, $4, $5, NOW())
                `,
                ['UPDATE', `${user_type}_users`, id, 1, JSON.stringify({ ...body, user_id: id })]
            );

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: `${user_type} user updated successfully`,
                data: result.rows[0]
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update user' },
            { status: 500 }
        );
    }
}

// DELETE - Delete user
export async function DELETE(req, { params }) {
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

        const { id } = params;
        const { searchParams } = new URL(req.url);
        const user_type = searchParams.get('user_type') || 'business';

        const client = await pool.connectWithRetry();
        
        try {
            await client.query('BEGIN');

            let deleteQuery;
            let tableName;
            let userRecord = null;

            if (user_type === 'business') {
                // First get the business user details for logging
                const getUserQuery = 'SELECT user_id, trade_name FROM business_users WHERE user_id = $1';
                const getUserResult = await client.query(getUserQuery, [id]);
                
                if (getUserResult.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return NextResponse.json(
                        { success: false, error: 'Business user not found' },
                        { status: 404 }
                    );
                }
                
                userRecord = getUserResult.rows[0];
                deleteQuery = 'DELETE FROM business_users WHERE user_id = $1 RETURNING user_id, trade_name';
                tableName = 'business_users';
            } else if (user_type === 'individual') {
                // First get the individual user details for logging
                const getUserQuery = 'SELECT user_id, first_name, last_name FROM individual_users WHERE user_id = $1';
                const getUserResult = await client.query(getUserQuery, [id]);
                
                if (getUserResult.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return NextResponse.json(
                        { success: false, error: 'Individual user not found' },
                        { status: 404 }
                    );
                }
                
                userRecord = getUserResult.rows[0];
                deleteQuery = 'DELETE FROM individual_users WHERE user_id = $1 RETURNING user_id, first_name, last_name';
                tableName = 'individual_users';
            } else if (user_type === 'bank') {
                // First get the bank user details for logging
                const getUserQuery = 'SELECT user_id, email FROM bank_users WHERE user_id = $1';
                const getUserResult = await client.query(getUserQuery, [id]);
                
                if (getUserResult.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return NextResponse.json(
                        { success: false, error: 'Bank user not found' },
                        { status: 404 }
                    );
                }
                
                userRecord = getUserResult.rows[0];
                deleteQuery = 'DELETE FROM bank_users WHERE user_id = $1 RETURNING user_id, email';
                tableName = 'bank_users';
            } else {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'Invalid user_type parameter' },
                    { status: 400 }
                );
            }

            const result = await client.query(deleteQuery, [id]);

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'User not found' },
                    { status: 404 }
                );
            }

            // Log the deletion
            await client.query(
                `
                INSERT INTO admin_audit_log 
                    (action, table_name, record_id, admin_user_id, details, timestamp)
                VALUES ($1, $2, $3, $4, $5, NOW())
                `,
                ['DELETE', tableName, id, adminUser.admin_id, JSON.stringify({ 
                    user_id: id, 
                    user_type,
                    user_details: userRecord 
                })]
            );

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: `${user_type} user deleted successfully`,
                data: result.rows[0]
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}
