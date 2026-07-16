import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

export async function POST(req) {
    try {
        const body = await req.json();
        const {
            entity_name,
            credit_limit = 10000.00,
            contact_person,
            contact_person_number,
            logo_url
        } = body;

        // A bank/financing partner is created as an entity WITHOUT login credentials.
        // Login is provided later via bank employees created under this bank.
        if (!entity_name || !entity_name.trim()) {
            return NextResponse.json(
                { success: false, error: 'Bank name is required' },
                { status: 400 }
            );
        }
        if (credit_limit != null && (isNaN(Number(credit_limit)) || Number(credit_limit) < 0)) {
            return NextResponse.json(
                { success: false, error: 'Credit limit must be a non-negative number' },
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

            // Create the entity's users row WITHOUT credentials (NULL email/password).
            // A NULL password can never authenticate (unified-login filters it out).
            // logo_url is written to BOTH users and bank_users so every display path
            // resolves regardless of which table it reads.
            const userRes = await client.query(
                `INSERT INTO users (email, password, user_type, entity_name, account_status, logo_url, created_at, updated_at)
                 VALUES (NULL, NULL, 'bank_user', $1, 'active', $2, NOW(), NOW())
                 RETURNING user_id`,
                [entity_name.trim(), logo_url || null]
            );
            const user_id = userRes.rows[0].user_id;

            // Create the bank profile row (anchors offers/views FKs). No email.
            await client.query(
                `INSERT INTO bank_users (user_id, email, credit_limit, contact_person, contact_person_number, logo_url)
                 VALUES ($1, NULL, $2, $3, $4, $5)`,
                [
                    user_id,
                    credit_limit,
                    contact_person || null,
                    contact_person_number || null,
                    logo_url || null
                ]
            );

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Bank/financing partner created successfully',
                data: {
                    user_id,
                    entity_name: entity_name.trim(),
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
