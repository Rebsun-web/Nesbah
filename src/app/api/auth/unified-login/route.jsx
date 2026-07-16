import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import JWTUtils from '@/lib/auth/jwt-utils';
import AdminAuth from '@/lib/auth/admin-auth';

// Tell Next.js to abort this route after 30s and return a proper error
// instead of letting the request hang until Cloud Run's 300s hard limit.
// export const maxDuration = 30;

const LOGIN_TIMEOUT_MS = 30000;

function maskEmail(email) {
    if (!email || !email.includes('@')) return '(invalid)';
    return `***@${email.split('@')[1]}`;
}

function poolSnap() {
    return { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount };
}

export async function POST(req) {
    const reqId = Math.random().toString(36).slice(2, 8).toUpperCase();
    const start = Date.now();
    const elapsed = () => `+${Date.now() - start}ms`;

    console.log(`[LOGIN:${reqId}] ENTRY pool=${JSON.stringify(poolSnap())}`);

    let email;
    try {
        const body = await req.json();
        email = body.email;
        const { password, mfaToken } = body;

        console.log(`[LOGIN:${reqId}] START email=${maskEmail(email)} mfa=${!!mfaToken} pool=${JSON.stringify(poolSnap())}`);

        // Reject missing fields before touching the DB. Deliberately not a format
        // check here (e.g. "not a valid email") — that plus a different error
        // message than a real login failure could let a caller enumerate accounts.
        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const loginPromise = performLogin(reqId, elapsed, email, password, mfaToken);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Login timeout')), LOGIN_TIMEOUT_MS)
        );

        const result = await Promise.race([loginPromise, timeoutPromise]);
        console.log(`[LOGIN:${reqId}] DONE ${elapsed()} status=${result.status}`);
        return result;
    } catch (error) {
        if (error.message === 'Login timeout') {
            console.error(`[LOGIN:${reqId}] TIMEOUT after ${elapsed()} pool=${JSON.stringify(poolSnap())}`);
            return NextResponse.json(
                { success: false, error: 'Service temporarily unavailable, please try again' },
                { status: 503 }
            );
        }
        console.error(`[LOGIN:${reqId}] OUTER ERROR ${elapsed()}`, {
            message: error.message,
            code: error.code,
            address: error.address,
            port: error.port,
            pool: poolSnap(),
        });
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function performLogin(reqId, elapsed, email, password, mfaToken) {
    const log = (msg, extra) => console.log(`[LOGIN:${reqId}] ${elapsed()} ${msg}`, extra || '');

    log(`POOL_CONNECT pool=${JSON.stringify(poolSnap())}`);
    const client = await pool.connectWithRetry(2, 1000, 'unified-login');
    log(`POOL_CONNECT_OK pool=${JSON.stringify(poolSnap())}`);

    // Tracks whether a retryable DB error occurred so we can destroy the
    // connection instead of returning it to the idle pool as "healthy".
    const connState = { releaseErr: null };

    try {
        log('USER_LOOKUP');
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
             WHERE u.email = $1
               -- Exclude login-less entity rows (e.g. bank/partner profiles created
               -- without credentials). Only rows with a real password can authenticate.
               AND u.password IS NOT NULL
             -- Deterministic pick if two rows ever share an email, so we never
             -- bcrypt.compare against an arbitrary row.
             ORDER BY u.user_id ASC
             LIMIT 1`,
            [email]
        );

        if (userTypeQuery.rowCount === 0) {
            log(`USER_NOT_FOUND email=${maskEmail(email)}`);
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const userData = userTypeQuery.rows[0];
        const { auth_category, user_type, account_status } = userData;
        log(`USER_FOUND type=${user_type} category=${auth_category} status=${account_status}`);

        switch (auth_category) {
            case 'admin':
                log('ROUTE->admin');
                return await handleAdminLogin(reqId, elapsed, userData, password, mfaToken);

            case 'bank_employee':
                log('ROUTE->bank_employee');
                return await handleBankEmployeeLogin(reqId, elapsed, client, userData, password, connState);

            case 'regular_user':
                log('ROUTE->regular_user');
                return await handleRegularUserLogin(reqId, elapsed, client, userData, password, account_status, connState);

            default:
                log(`ROUTE->unknown category=${auth_category}`);
                return NextResponse.json(
                    { success: false, error: 'Invalid user type' },
                    { status: 400 }
                );
        }

    } catch (err) {
        if (pool.isRetryableError(err)) connState.releaseErr = err;
        throw err;
    } finally {
        client.release(connState.releaseErr || undefined);
        log(`CLIENT_RELEASED${connState.releaseErr ? ' (destroyed—stale)' : ''} pool=${JSON.stringify(poolSnap())}`);
    }
}

async function handleAdminLogin(reqId, elapsed, userData, password, mfaToken) {
    const log = (msg) => console.log(`[LOGIN:${reqId}] ${elapsed()} ADMIN ${msg}`);
    log(`START email=${maskEmail(userData.email)}`);
    try {
        const authResult = await AdminAuth.validateCredentialsWithMFA(userData.email, password, mfaToken);

        if (!authResult.valid) {
            if (authResult.requiresMFA) {
                log('MFA_REQUIRED');
                return NextResponse.json(
                    {
                        success: false,
                        error: authResult.error,
                        requiresMFA: true,
                        user: authResult.adminUser
                    },
                    { status: 401 }
                );
            }
            log(`INVALID reason=${authResult.error}`);
            return NextResponse.json(
                { success: false, error: authResult.error },
                { status: 401 }
            );
        }

        const adminUser = authResult.adminUser;
        await AdminAuth.updateLastLogin(adminUser.user_id);
        const token = JWTUtils.generateAdminToken(adminUser);
        log('SUCCESS');

        const response = NextResponse.json({
            success: true,
            user: {
                user_id: adminUser.user_id,
                admin_id: adminUser.user_id,
                email: adminUser.email,
                full_name: adminUser.entity_name,
                entity_name: adminUser.entity_name,
                role: adminUser.role,
                permissions: adminUser.permissions,
                is_active: adminUser.account_status === 'active',
                user_type: 'admin_user'
            },
            token: token,
            redirect: '/admin',
            message: 'Admin login successful'
        });

        response.cookies.set('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60,
            path: '/'
        });

        return response;

    } catch (error) {
        log(`ERROR ${error.message}`);
        return NextResponse.json(
            { success: false, error: 'Admin authentication failed' },
            { status: 500 }
        );
    }
}

async function handleBankEmployeeLogin(reqId, elapsed, client, userData, password, connState = {}) {
    const log = (msg) => console.log(`[LOGIN:${reqId}] ${elapsed()} BANK_EMP ${msg}`);
    log(`START email=${maskEmail(userData.email)}`);
    try {
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
            log('EMPLOYEE_PROFILE_NOT_FOUND');
            return NextResponse.json(
                { success: false, error: 'Employee profile not found' },
                { status: 401 }
            );
        }

        const employeeData = employeeQuery.rows[0];

        log('BCRYPT_START');
        // Trim to match create/reset flows (which also trim) so trailing whitespace
        // never causes a false mismatch on first login.
        const passwordMatch = await bcrypt.compare((password || '').trim(), userData.password);
        log(`BCRYPT_DONE match=${passwordMatch}`);

        if (!passwordMatch) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        await client.query(
            `UPDATE bank_employees SET last_login_at = NOW() WHERE employee_id = $1`,
            [employeeData.employee_id]
        );

        const token = JWTUtils.generateUserToken({
            ...userData,
            user_type: 'bank_employee',
            employee_id: employeeData.employee_id,
            bank_user_id: employeeData.bank_user_id
        });

        log('SUCCESS');

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

        response.cookies.set('user_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        return response;

    } catch (error) {
        log(`ERROR ${error.message} code=${error.code}`);
        if (pool.isRetryableError(error)) connState.releaseErr = error;
        return NextResponse.json(
            { success: false, error: 'Bank employee authentication failed' },
            { status: 500 }
        );
    }
}

async function handleRegularUserLogin(reqId, elapsed, client, userData, password, account_status, connState = {}) {
    const log = (msg) => console.log(`[LOGIN:${reqId}] ${elapsed()} REGULAR ${msg}`);
    log(`START type=${userData.user_type} status=${account_status} email=${maskEmail(userData.email)}`);
    try {
        if (account_status !== 'active') {
            log(`INACTIVE status=${account_status}`);
            return NextResponse.json(
                { success: false, error: 'Account is inactive' },
                { status: 401 }
            );
        }

        const userInfoQuery = await client.query(
            `SELECT bu.logo_url FROM bank_users bu WHERE bu.user_id = $1`,
            [userData.user_id]
        );
        const logoUrl = userInfoQuery.rowCount > 0 ? userInfoQuery.rows[0].logo_url : null;

        log('BCRYPT_START');
        // Trim to match create/reset flows (which also trim) so trailing whitespace
        // never causes a false mismatch on first login.
        const passwordMatch = await bcrypt.compare((password || '').trim(), userData.password);
        log(`BCRYPT_DONE match=${passwordMatch}`);

        if (!passwordMatch) {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const token = JWTUtils.generateUserToken(userData);
        const redirect = userData.user_type === 'bank_user' ? '/bankPortal' : '/portal';
        log(`SUCCESS redirect=${redirect}`);

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

        response.cookies.set('user_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        return response;

    } catch (error) {
        log(`ERROR ${error.message} code=${error.code}`);
        if (pool.isRetryableError(error)) connState.releaseErr = error;
        return NextResponse.json(
            { success: false, error: 'User authentication failed' },
            { status: 500 }
        );
    }
}
