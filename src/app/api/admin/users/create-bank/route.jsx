import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import AdminAuth from '@/lib/auth/admin-auth';

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
            email, 
            password, 
            entity_name,
            credit_limit = 10000.00,
            contact_person,
            contact_person_number
        } = body;

        // Validate required fields
        if (!email || !password || !entity_name) {
            return NextResponse.json(
                { success: false, error: 'email, password, and entity_name are required' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry();
        try {
            await client.query('BEGIN');

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

            // Create bank user record with simplified structure
            await client.query(
                `INSERT INTO bank_users (user_id, email, credit_limit, contact_person, contact_person_number)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    user_id,
                    email,
                    credit_limit,
                    contact_person || null,
                    contact_person_number || null
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
