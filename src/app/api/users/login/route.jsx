import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import JWTUtils from '@/lib/auth/jwt-utils';

export async function POST(req) {
    try {
        const { email, password } = await req.json();
        console.log('🔐 Login attempt for:', email);

        const client = await pool.connectWithRetry();
        
        try {
            // REGULAR USER LOGIN ONLY - Admin users are handled by /api/admin/auth/login
            const userQuery = await client.query(
                `SELECT 
                    u.user_id,
                    u.email,
                    u.password,
                    u.user_type,
                    u.entity_name,
                    bu.logo_url
                 FROM users u
                 LEFT JOIN bank_users bu ON u.user_id = bu.user_id
                 WHERE u.email = $1`,
                [email]
            );

            if (userQuery.rowCount > 0) {
                const user = userQuery.rows[0];
                console.log('✅ Regular user found:', user.email, 'Type:', user.user_type);
                
                // Use bcrypt to compare passwords
                const passwordMatch = await bcrypt.compare(password, user.password);
                console.log('🔑 Password match result:', passwordMatch);

                if (passwordMatch) {
                    // Generate JWT token for user
                    const token = JWTUtils.generateUserToken(user);

                    let redirect = '/portal';
                    if (user.user_type === 'admin_user') {
                        redirect = '/admin';
                    } else if (user.user_type === 'bank_user') {
                        redirect = '/bankPortal';
                    }

                    console.log('✅ Regular user login successful for:', email, 'Redirecting to:', redirect);

                    // Set HTTP-only cookie for regular user
                    const response = NextResponse.json({
                        success: true,
                        user: {
                            user_id: user.user_id,
                            email: user.email,
                            user_type: user.user_type,
                            entity_name: user.entity_name,
                            logo_url: user.logo_url
                        },
                        redirect: redirect
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
                    console.log('❌ Password mismatch for regular user:', email);
                }
            }

            // If we get here, no regular user was found or password was wrong
            console.log('❌ No valid regular user found for:', email);
            return NextResponse.json(
                { success: false, error: 'Invalid email or password' },
                { status: 401 }
            );

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
