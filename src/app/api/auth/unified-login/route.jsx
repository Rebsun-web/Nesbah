import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import JWTUtils from '@/lib/auth/jwt-utils';
import AdminAuth from '@/lib/auth/admin-auth';

export async function POST(req) {
    try {
        const { email, password, mfaToken } = await req.json();
        console.log('🔐 Unified login attempt for:', email);

        const client = await pool.connectWithRetry(2, 1000, 'app_api_auth_unified-login_route.jsx_route');
        
        try {
            // Step 1: Determine user type with a single query
            const userTypeQuery = await client.query(
                `SELECT 
                    u.user_id,
                    u.email,
                    u.password,
                    u.user_type,
                    u.entity_name,
                    u.account_status,
                    CASE 
                        WHEN u.user_type = 'admin_user' THEN 'admin'
                        WHEN u.user_type = 'bank_employee' THEN 'bank_employee'
                        WHEN u.user_type IN ('business_user', 'bank_user') THEN 'regular_user'
                        ELSE 'unknown'
                    END as auth_category
                 FROM users u
                 WHERE u.email = $1`,
                [email]
            );

            if (userTypeQuery.rowCount === 0) {
                console.log('❌ User not found:', email);
                return NextResponse.json(
                    { success: false, error: 'Invalid credentials' },
                    { status: 401 }
                );
            }

            const userData = userTypeQuery.rows[0];
            const { auth_category, user_type, account_status } = userData;

            console.log('🔍 User type determined:', user_type, 'Auth category:', auth_category);

            // Step 2: Route to appropriate authentication method
            switch (auth_category) {
                case 'admin':
                    return await handleAdminLogin(userData, password, mfaToken);
                
                case 'bank_employee':
                    return await handleBankEmployeeLogin(client, userData, password);
                
                case 'regular_user':
                    return await handleRegularUserLogin(client, userData, password, account_status);
                
                default:
                    return NextResponse.json(
                        { success: false, error: 'Invalid user type' },
                        { status: 400 }
                    );
            }

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Unified login error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Admin authentication handler
async function handleAdminLogin(userData, password, mfaToken) {
    try {
        console.log('🔐 Processing admin login for:', userData.email);
        
        // Validate admin credentials using the updated AdminAuth class
        const authResult = await AdminAuth.validateCredentials(userData.email, password);
        
        if (!authResult.valid) {
            return NextResponse.json(
                { success: false, error: authResult.error },
                { status: 401 }
            );
        }

        const adminUser = authResult.adminUser;

        // Update last login timestamp
        await AdminAuth.updateLastLogin(adminUser.user_id);

        // Generate JWT token
        const token = JWTUtils.generateAdminToken(adminUser);

        console.log('✅ Admin login successful for:', userData.email);

        // Set HTTP-only cookie with JWT token
        const response = NextResponse.json({
            success: true,
            user: {
                user_id: adminUser.user_id,
                admin_id: adminUser.user_id, // For backward compatibility
                email: adminUser.email,
                full_name: adminUser.entity_name,
                entity_name: adminUser.entity_name,
                role: adminUser.role,
                permissions: adminUser.permissions,
                is_active: adminUser.account_status === 'active',
                user_type: 'admin_user'
            },
            token: token, // Include JWT token in response body for frontend storage
            redirect: '/admin',
            message: 'Admin login successful'
        });

        // Set JWT token as HTTP-only cookie
        response.cookies.set('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60, // 24 hours
            path: '/'
        });

        return response;

    } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json(
            { success: false, error: 'Admin authentication failed' },
            { status: 500 }
        );
    }
}

// Bank employee authentication handler
async function handleBankEmployeeLogin(client, userData, password) {
    try {
        console.log('🏦 Processing bank employee login for:', userData.email);
        
        // Get additional bank employee information
        const employeeQuery = await client.query(
            `SELECT 
                be.employee_id,
                be.first_name,
                be.last_name,
                be.position,
                be.bank_user_id,
                bu.logo_url
             FROM bank_employees be
             LEFT JOIN bank_users bu ON be.bank_user_id = bu.user_id
             WHERE be.user_id = $1`,
            [userData.user_id]
        );

        if (employeeQuery.rowCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Employee profile not found' },
                { status: 401 }
            );
        }

        const employeeData = employeeQuery.rows[0];

        // Verify password
        const passwordMatch = await bcrypt.compare(password, userData.password);
        if (!passwordMatch) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Update last login timestamp
        await client.query(
            `UPDATE bank_employees SET last_login_at = NOW() WHERE employee_id = $1`,
            [employeeData.employee_id]
        );

        // Generate JWT token
        const token = JWTUtils.generateUserToken({
            ...userData,
            user_type: 'bank_employee',
            employee_id: employeeData.employee_id,
            bank_user_id: employeeData.bank_user_id
        });

        console.log('✅ Bank employee login successful for:', userData.email);

        const response = NextResponse.json({
            success: true,
            user: {
                user_id: userData.user_id,
                employee_id: employeeData.employee_id,
                email: userData.email,
                user_type: 'bank_employee',
                first_name: employeeData.first_name,
                last_name: employeeData.last_name,
                position: employeeData.position,
                entity_name: userData.entity_name,
                bank_user_id: employeeData.bank_user_id,
                logo_url: employeeData.logo_url
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

    } catch (error) {
        console.error('Bank employee login error:', error);
        return NextResponse.json(
            { success: false, error: 'Bank employee authentication failed' },
            { status: 500 }
        );
    }
}

// Regular user authentication handler
async function handleRegularUserLogin(client, userData, password, account_status) {
    try {
        console.log('🔐 Processing regular user login for:', userData.email);
        
        // Check if account is active
        if (account_status !== 'active') {
            return NextResponse.json(
                { success: false, error: 'Account is inactive' },
                { status: 401 }
            );
        }

        // Get additional user information
        const userInfoQuery = await client.query(
            `SELECT 
                bu.logo_url
             FROM bank_users bu
             WHERE bu.user_id = $1`,
            [userData.user_id]
        );

        const logoUrl = userInfoQuery.rowCount > 0 ? userInfoQuery.rows[0].logo_url : null;

        // Verify password
        const passwordMatch = await bcrypt.compare(password, userData.password);
        if (!passwordMatch) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = JWTUtils.generateUserToken(userData);

        let redirect = '/portal';
        if (userData.user_type === 'bank_user') {
            redirect = '/bankPortal';
        }

        console.log('✅ Regular user login successful for:', userData.email, 'Redirecting to:', redirect);

        const response = NextResponse.json({
            success: true,
            user: {
                user_id: userData.user_id,
                email: userData.email,
                user_type: userData.user_type,
                entity_name: userData.entity_name,
                logo_url: logoUrl
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

    } catch (error) {
        console.error('Regular user login error:', error);
        return NextResponse.json(
            { success: false, error: 'User authentication failed' },
            { status: 500 }
        );
    }
}
