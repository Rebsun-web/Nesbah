import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import JWTUtils from '@/lib/auth/jwt-utils';

export async function POST(req) {
    try {
        const { email, password } = await req.json();
        console.log('🏦 Bank employee login attempt for:', email);

        const client = await pool.connectWithRetry(2, 1000, 'app_api_users_login_bank-employee_route.jsx_route');
        
        try {
            // Get bank employee user with bank information including bank logo
            const userQuery = await client.query(
                `SELECT 
                    u.user_id,
                    u.email,
                    u.password,
                    u.user_type,
                    u.entity_name,
                    u.account_status,
                    be.employee_id,
                    be.first_name,
                    be.last_name,
                    be.position,
                    be.bank_user_id,
                    be.is_active as employee_active,
                    u.entity_name as bank_entity_name,
                    bu.logo_url
                 FROM users u
                 JOIN bank_employees be ON u.user_id = be.user_id
                 LEFT JOIN bank_users bu ON be.bank_user_id = bu.user_id
                 WHERE u.email = $1 AND u.user_type = 'bank_employee'`,
                [email]
            );

            if (userQuery.rowCount === 0) {
                console.log('❌ Bank employee not found:', email);
                return NextResponse.json(
                    { success: false, error: 'Invalid credentials' },
                    { status: 401 }
                );
            }

            const user = userQuery.rows[0];
            console.log('✅ Bank employee found:', user.email, 'Employee ID:', user.employee_id);

            // Check if employee account is active
            if (!user.employee_active) {
                console.log('❌ Bank employee account is inactive:', email);
                return NextResponse.json(
                    { success: false, error: 'Account is inactive. Please contact your administrator.' },
                    { status: 403 }
                );
            }

            // Check if user account is active
            if (user.account_status !== 'active') {
                console.log('❌ User account is inactive:', email);
                return NextResponse.json(
                    { success: false, error: 'Account is inactive. Please contact your administrator.' },
                    { status: 403 }
                );
            }

            // Use bcrypt to compare passwords
            const passwordMatch = await bcrypt.compare(password, user.password);
            console.log('🔑 Password match result:', passwordMatch);

            if (passwordMatch) {
                // Update last login timestamp
                await client.query(
                    `UPDATE bank_employees SET last_login_at = NOW() WHERE employee_id = $1`,
                    [user.employee_id]
                );

                // Log the login action
                await client.query(
                    `INSERT INTO bank_employee_audit_log (
                        employee_id, 
                        bank_user_id, 
                        action_type, 
                        action_details, 
                        ip_address
                    ) VALUES ($1, $2, $3, $4, $5)`,
                    [
                        user.employee_id,
                        user.bank_user_id,
                        'login',
                        'Bank employee logged in successfully',
                        req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
                    ]
                );

                // Generate JWT token for bank employee
                const token = JWTUtils.generateUserToken({
                    ...user,
                    user_type: 'bank_employee',
                    employee_id: user.employee_id,
                    bank_user_id: user.bank_user_id
                });

                console.log('✅ Bank employee login successful for:', email, 'Bank:', user.bank_entity_name);

                // Set HTTP-only cookie for bank employee
                const response = NextResponse.json({
                    success: true,
                    user: {
                        user_id: user.user_id,
                        employee_id: user.employee_id,
                        email: user.email,
                        user_type: 'bank_employee',
                        first_name: user.first_name,
                        last_name: user.last_name,
                        position: user.position,
                        entity_name: user.bank_entity_name,
                        bank_user_id: user.bank_user_id,
                        logo_url: user.logo_url
                    },
                    redirect: '/bankPortal'
                });

                // Set user token cookie
                response.cookies.set('user_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 24 * 60 * 60 * 1000 // 24 hours
                });

                return response;
            } else {
                console.log('❌ Password mismatch for bank employee:', email);
                return NextResponse.json(
                    { success: false, error: 'Invalid credentials' },
                    { status: 401 }
                );
            }

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Bank employee login error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
