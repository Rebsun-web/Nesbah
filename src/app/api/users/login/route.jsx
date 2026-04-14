import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import JWTUtils from '@/lib/auth/jwt-utils';

// In-memory rate limiter: max 10 attempts per IP per 15 minutes
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = loginAttempts.get(ip);
    if (!entry || now > entry.resetAt) {
        loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }
    if (entry.count >= RATE_LIMIT_MAX) return false;
    entry.count += 1;
    return true;
}

export async function POST(req) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { success: false, error: 'Too many login attempts. Try again in 15 minutes.' },
                { status: 429 }
            );
        }

        const { email, password } = await req.json();
        console.log('🔐 Login attempt for:', email);

        const client = await pool.connectWithRetry(2, 1000, 'app_api_users_login_route.jsx_route');
        
        try {
            // REGULAR USER LOGIN ONLY - Admin users are handled by /api/auth/unified-login
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
                    // Remove admin user handling - admin users should use /api/auth/unified-login
                    if (user.user_type === 'bank_user') {
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
