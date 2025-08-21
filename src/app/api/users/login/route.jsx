import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req) {
    try {
        const { email, password } = await req.json();
        console.log('🔐 Login attempt for:', email);

        const userQuery = await pool.query(
            `SELECT * FROM users WHERE email = $1`,
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

        let redirect = '/portal';
        if (user.user_type === 'admin_user') {
            redirect = '/adminPortal';
        } else if (user.user_type === 'bank_user') {
            redirect = '/bankPortal';
        }

        console.log('✅ Login successful for:', email, 'Redirecting to:', redirect);
        return NextResponse.json({
            success: true,
            user: {
                user_id: user.user_id,
                email: user.email,
                user_type: user.user_type,
                // Add more if needed
            },
            redirect,
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
