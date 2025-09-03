import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import AdminAuth from '@/lib/auth/admin-auth';

export async function POST(req) {
    try {
        const body = await req.json();
        const { 
            email, 
            password, 
            first_name,
            last_name,
            position,
            phone,
            bank_user_id // ID of the existing bank entity
        } = body;

        // Validate required fields
        if (!email || !password || !first_name || !last_name || !bank_user_id) {
            return NextResponse.json(
                { success: false, error: 'Email, password, first name, last name, and bank user ID are required' },
                { status: 400 }
            );
        }

        // Validate admin authentication
        const adminToken = req.cookies.get('admin_token')?.value;
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_users_create-bank-employee_route.jsx_route');
        try {
            console.log('🔧 Starting bank employee creation transaction...');
            await client.query('BEGIN');

            // 1. Verify the bank entity exists and get its information
            const bankCheck = await client.query(
                `SELECT u.user_id, u.entity_name, bu.logo_url FROM users u 
                 LEFT JOIN bank_users bu ON u.user_id = bu.user_id 
                 WHERE u.user_id = $1 AND u.user_type = 'bank_user'`,
                [bank_user_id]
            );

            if (bankCheck.rowCount === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'Bank entity not found' },
                    { status: 404 }
                );
            }

            const bankEntity = bankCheck.rows[0];

            // 2. Check if user already exists
            const existingUser = await client.query(
                `SELECT user_id FROM users WHERE email = $1`,
                [email]
            );

            if (existingUser.rowCount > 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'User with this email already exists' },
                    { status: 409 }
                );
            }

            // 3. Hash the password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // 4. Create user record with user_type = 'bank_employee'
            const userRes = await client.query(
                `INSERT INTO users (email, password, user_type, entity_name, account_status, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                 RETURNING user_id`,
                [email, hashedPassword, 'bank_employee', bankEntity.entity_name, 'active']
            );
            const user_id = userRes.rows[0].user_id;

            // 5. Create bank employee record
            console.log('🔧 Creating bank employee record with data:', {
                bank_user_id,
                user_id,
                first_name,
                last_name,
                position: position || null,
                phone: phone || null
            });
            
            const employeeRes = await client.query(
                `INSERT INTO bank_employees (
                    bank_user_id, 
                    user_id, 
                    first_name, 
                    last_name, 
                    position, 
                    phone, 
                    created_at
                )
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())
                 RETURNING employee_id`,
                [
                    bank_user_id,
                    user_id,
                    first_name,
                    last_name,
                    position || null,
                    phone || null
                ]
            );

            const employee_id = employeeRes.rows[0].employee_id;

            // 6. Log the action in audit log
            await client.query(
                `INSERT INTO bank_employee_audit_log (
                    employee_id, 
                    bank_user_id, 
                    action_type, 
                    action_details, 
                    ip_address
                ) VALUES ($1, $2, $3, $4, $5)`,
                [
                    employee_id,
                    bank_user_id,
                    'account_created',
                    `Bank employee account created by admin for ${email}`,
                    req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
                ]
            );

            await client.query('COMMIT');
            console.log('🔧 Bank employee created successfully:', { employee_id, user_id, email });

            return NextResponse.json({
                success: true,
                message: 'Bank employee created successfully',
                data: {
                    employee_id,
                    user_id,
                    email,
                    first_name,
                    last_name,
                    position,
                    phone,
                    bank_user_id,
                    bank_entity_name: bankEntity.entity_name,
                    bank_logo_url: bankEntity.logo_url,
                    created_at: new Date().toISOString()
                }
            });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Database transaction failed:', err);
            return NextResponse.json(
                { success: false, error: 'Failed to create bank employee' },
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
