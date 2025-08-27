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
            // OPTIMIZED: Single query to get user data with bank info if applicable
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

            if (userQuery.rowCount === 0) {
                console.log('❌ User not found:', email);
                return NextResponse.json(
                    { success: false, error: 'Invalid email or password' },
                    { status: 401 }
                );
            }

            const user = userQuery.rows[0];
            console.log('✅ User found:', user.email, 'Type:', user.user_type);
            
            // Use bcrypt to compare passwords
            const passwordMatch = await bcrypt.compare(password, user.password);
            console.log('🔑 Password match result:', passwordMatch);

            if (!passwordMatch) {
                console.log('❌ Password mismatch for:', email);
                return NextResponse.json(
                    { success: false, error: 'Invalid email or password' },
                    { status: 401 }
                );
            }

            // Generate JWT token for user
            const token = JWTUtils.generateUserToken(user);

            let redirect = '/portal';
            if (user.user_type === 'admin_user') {
                redirect = '/adminPortal';
            } else if (user.user_type === 'bank_user') {
                redirect = '/bankPortal';
            }

            // Build user data object
            const userData = {
                user_id: user.user_id,
                email: user.email,
                user_type: user.user_type,
                jwt_token: token,
                entity_name: user.entity_name,
                logo_url: user.logo_url
            };

            console.log('✅ Login successful for:', email, 'Redirecting to:', redirect);
            return NextResponse.json({
                success: true,
                user: userData,
                redirect,
            });
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
