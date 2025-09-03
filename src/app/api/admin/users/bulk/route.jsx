import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import AdminAuth from '@/lib/auth/admin-auth';

// POST - Bulk operations (status update, deletion, creation)
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
        const { operation, user_ids, user_type, ...operationData } = body;

        if (!operation || !user_type || !['business', 'individual', 'bank'].includes(user_type)) {
            return NextResponse.json(
                { success: false, error: 'Valid operation and user_type are required' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_users_bulk_route.jsx_route');
        
        try {
            await client.query('BEGIN');

            let result;
            let tableName;

            if (user_type === 'business') {
                tableName = 'business_users';
            } else if (user_type === 'individual') {
                tableName = 'individual_users';
            } else if (user_type === 'bank') {
                tableName = 'bank_users';
            }

            if (operation === 'create') {
                // Handle bulk user creation
                const { users } = operationData;
                
                if (!users || !Array.isArray(users) || users.length === 0) {
                    await client.query('ROLLBACK');
                    return NextResponse.json(
                        { success: false, error: 'users array is required for creation' },
                        { status: 400 }
                    );
                }

                const createdUsers = [];

                for (const userData of users) {
                    try {
                        // Validate required fields based on user type
                        if (user_type === 'business') {
                            if (!userData.trade_name) {
                                throw new Error('trade_name is required for business users');
                            }
                        } else if (user_type === 'individual') {
                            if (!userData.email || !userData.first_name || !userData.last_name) {
                                throw new Error('email, first_name, and last_name are required for individual users');
                            }
                        } else if (user_type === 'bank') {
                            if (!userData.email || !userData.entity_name) {
                                throw new Error('email and entity_name are required for bank users');
                            }
                        }

                        // Create specific user record based on type
                        if (user_type === 'business') {
                            // For business users, create with all the fields that would come from Wathiq API
                            const businessUserResult = await client.query(
                                `INSERT INTO business_users (
                                    cr_national_number, cr_number, trade_name, address, sector, 
                                    registration_status, cash_capital, in_kind_capital, contact_info, 
                                    store_url, legal_form, issue_date_gregorian, confirmation_date_gregorian, 
                                    has_ecommerce, management_structure, management_managers, cr_capital,
                                    city, contact_person, contact_person_number
                                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                                RETURNING user_id`,
                                [
                                    userData.cr_national_number || `CR${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                    userData.cr_number || `CR${Date.now()}`,
                                    userData.trade_name,
                                    userData.address || userData.city || 'Default Address',
                                    userData.sector || 'Technology',
                                    userData.registration_status || 'active',
                                    userData.cash_capital || null,
                                    userData.in_kind_capital || null,
                                    userData.contact_info ? JSON.stringify(userData.contact_info) : null,
                                    userData.store_url || null,
                                    userData.legal_form || null,
                                    userData.issue_date_gregorian || null,
                                    userData.confirmation_date_gregorian || null,
                                    userData.has_ecommerce || false,
                                    userData.management_structure || null,
                                    userData.management_managers ? JSON.stringify(Array.isArray(userData.management_managers) ? userData.management_managers : userData.management_managers.split(',').map(item => item.trim()).filter(item => item.length > 0)) : null,
                                    userData.cr_capital || null,
                                    userData.city || null,
                                    userData.contact_person || null,
                                    userData.contact_person_number || null
                                ]
                            );
                            
                            const userId = businessUserResult.rows[0].user_id;

                            createdUsers.push({
                                user_id: userId,
                                trade_name: userData.trade_name,
                                user_type,
                                status: 'created'
                            });

                        } else if (user_type === 'individual') {
                            // Hash password if provided, otherwise use default
                            const password = userData.password || 'default_password';
                            const saltRounds = 10;
                            const hashedPassword = await bcrypt.hash(password, saltRounds);

                            // Create user record first
                            const userResult = await client.query(
                                `INSERT INTO users (email, password, user_type, entity_name, account_status, created_at, updated_at)
                                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                                 RETURNING user_id`,
                                [
                                    userData.email, 
                                    hashedPassword, 
                                    'individual_user', 
                                    `${userData.first_name} ${userData.last_name}`.trim(), 
                                    userData.registration_status || 'active'
                                ]
                            );
                            
                            const userId = userResult.rows[0].user_id;

                            await client.query(
                                `INSERT INTO individual_users (user_id, national_id, first_name, last_name)
                                 VALUES ($1, $2, $3, $4)`,
                                [
                                    userId,
                                    userData.national_id || `ID${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                    userData.first_name,
                                    userData.last_name
                                ]
                            );

                            createdUsers.push({
                                user_id: userId,
                                email: userData.email,
                                user_type,
                                status: 'created'
                            });

                        } else if (user_type === 'bank') {
                            // Hash password if provided, otherwise use default
                            const password = userData.password || 'default_password';
                            const saltRounds = 10;
                            const hashedPassword = await bcrypt.hash(password, saltRounds);

                            // Create user record first
                            const userResult = await client.query(
                                `INSERT INTO users (email, password, user_type, entity_name, account_status, created_at, updated_at)
                                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                                 RETURNING user_id`,
                                [
                                    userData.email, 
                                    hashedPassword, 
                                    'bank_user', 
                                    userData.entity_name, 
                                    userData.registration_status || 'active'
                                ]
                            );
                            
                            const userId = userResult.rows[0].user_id;

                            // Bank users have simplified structure
                            await client.query(
                                `INSERT INTO bank_users (user_id, email, credit_limit, contact_person, contact_person_number)
                                 VALUES ($1, $2, $3, $4, $5)`,
                                [
                                    userId,
                                    userData.email,
                                    userData.credit_limit || 10000.00,
                                    userData.contact_person || null,
                                    userData.contact_person_number || null
                                ]
                            );

                            createdUsers.push({
                                user_id: userId,
                                email: userData.email,
                                user_type,
                                status: 'created'
                            });
                        }

                    } catch (userError) {
                        console.error(`Error creating user:`, userError);
                        createdUsers.push({
                            email: userData.email || userData.trade_name,
                            user_type,
                            status: 'failed',
                            error: userError.message
                        });
                    }
                }

                await client.query('COMMIT');

                return NextResponse.json({
                    success: true,
                    message: `Bulk ${user_type} user creation completed`,
                    data: {
                        operation: 'create',
                        user_type,
                        total_requested: users.length,
                        created_users: createdUsers,
                        successful_count: createdUsers.filter(u => u.status === 'created').length,
                        failed_count: createdUsers.filter(u => u.status === 'failed').length
                    }
                });

            } else if (operation === 'update_status') {
                // Handle status updates (existing functionality)
                if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
                    await client.query('ROLLBACK');
                    return NextResponse.json(
                        { success: false, error: 'user_ids array is required for status updates' },
                        { status: 400 }
                    );
                }

                const { registration_status } = operationData;
                
                if (!registration_status || !['active', 'suspended', 'inactive'].includes(registration_status)) {
                    await client.query('ROLLBACK');
                    return NextResponse.json(
                        { success: false, error: 'Valid registration_status is required' },
                        { status: 400 }
                    );
                }

                const placeholders = user_ids.map((_, index) => `$${index + 2}`).join(',');
                const query = `
                    UPDATE ${tableName} 
                    SET registration_status = $1
                    WHERE user_id IN (${placeholders})
                    RETURNING user_id, registration_status
                `;

                result = await client.query(query, [registration_status, ...user_ids]);

            } else if (operation === 'delete') {
                // Handle deletions (existing functionality)
                if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
                    await client.query('ROLLBACK');
                    return NextResponse.json(
                        { success: false, error: 'user_ids array is required for deletions' },
                        { status: 400 }
                    );
                }

                const placeholders = user_ids.map((_, index) => `$${index + 1}`).join(',');
                const query = `
                    DELETE FROM ${tableName} 
                    WHERE user_id IN (${placeholders})
                    RETURNING user_id
                `;

                result = await client.query(query, user_ids);

            } else {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'Invalid operation. Supported: create, update_status, delete' },
                    { status: 400 }
                );
            }

            if (operation !== 'create') {
                await client.query('COMMIT');

                return NextResponse.json({
                    success: true,
                    message: `Bulk ${operation} completed successfully`,
                    data: {
                        operation,
                        user_type,
                        affected_count: result.rows.length,
                        affected_users: result.rows
                    }
                });
            }

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Bulk operation error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to perform bulk operation' },
            { status: 500 }
        );
    }
}
