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
            entity_name,
            credit_limit = 10000.00,
            contact_person,
            contact_person_number,
            logo_url
        } = body;

        // Validate required fields
        if (!email || !password || !entity_name) {
            return NextResponse.json(
                { success: false, error: 'Email, password, and entity name are required' },
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

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_users_create-bank_route.jsx_route');
        try {
            await client.query('BEGIN');

            // Check if user already exists
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

            // Hash the password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Create user record
            const userRes = await client.query(
                `INSERT INTO users (email, password, user_type, entity_name, account_status, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                 RETURNING user_id`,
                [email, hashedPassword, 'bank_user', entity_name, 'active']
            );
            const user_id = userRes.rows[0].user_id;

            // Create bank user record with MVP fields only
            await client.query(
                `INSERT INTO bank_users (user_id, email, credit_limit, contact_person, contact_person_number, logo_url)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    user_id,
                    email,
                    credit_limit,
                    contact_person || null,
                    contact_person_number || null,
                    logo_url || null
                ]
            );

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Bank user created successfully',
                data: {
                    user_id,
                    email,
                    entity_name,
                    credit_limit,
                    contact_person,
                    contact_person_number,
                    logo_url,
                    created_at: new Date().toISOString()
                }
            });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Database transaction failed:', err);
            return NextResponse.json(
                { success: false, error: 'Failed to create bank user' },
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
