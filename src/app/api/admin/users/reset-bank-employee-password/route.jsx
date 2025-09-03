import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import AdminAuth from '@/lib/auth/admin-auth';

export async function POST(req) {
    try {
        const body = await req.json();
        const { user_id, custom_password } = body;

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

        if (!user_id) {
            return NextResponse.json(
                { success: false, error: 'User ID is required' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_users_reset-bank-employee-password_route.jsx_route');
        try {
            // Verify the bank employee exists
            const userCheck = await client.query(
                `SELECT u.user_id, u.email, u.user_type, u.entity_name FROM users u WHERE u.user_id = $1 AND u.user_type = 'bank_employee'`,
                [user_id]
            );

            if (userCheck.rowCount === 0) {
                return NextResponse.json(
                    { success: false, error: 'Bank employee not found' },
                    { status: 404 }
                );
            }

            const user = userCheck.rows[0];
            let newPassword;

            if (custom_password) {
                // Admin provided a custom password
                if (custom_password.length < 8) {
                    return NextResponse.json(
                        { success: false, error: 'Custom password must be at least 8 characters long' },
                        { status: 400 }
                    );
                }
                newPassword = custom_password;
            } else {
                // Generate a new secure password
                newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            }

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update the user's password
            await client.query(
                `UPDATE users SET password = $1, updated_at = NOW() WHERE user_id = $2`,
                [hashedPassword, user_id]
            );

            return NextResponse.json({
                success: true,
                message: custom_password ? 'Bank employee password set successfully' : 'Bank employee password reset successfully',
                password: newPassword,
                password_type: custom_password ? 'custom' : 'generated',
                data: {
                    user_id,
                    email: user.email,
                    entity_name: user.entity_name,
                    password_reset_at: new Date().toISOString()
                }
            });

        } catch (err) {
            console.error('Database error:', err);
            return NextResponse.json(
                { success: false, error: 'Failed to reset bank employee password' },
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
