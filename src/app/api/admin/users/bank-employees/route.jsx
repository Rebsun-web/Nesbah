import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

export async function GET(request) {
    const client = await pool.connectWithRetry();
    
    try {
        // Verify admin authentication
        const adminToken = request.cookies.get('admin_token')?.value;
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

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const bankUserId = searchParams.get('bank_user_id');
        const status = searchParams.get('status');

        let query = `
            SELECT 
                be.employee_id,
                be.first_name,
                be.last_name,
                be.position,
                be.phone,
                be.created_at,
                be.last_login_at,
                u.email,
                u.entity_name as bank_entity_name,
                be.bank_user_id,
                bu.logo_url as bank_logo_url
            FROM bank_employees be
            JOIN users u ON be.user_id = u.user_id
            LEFT JOIN bank_users bu ON be.bank_user_id = bu.user_id
        `;

        const queryParams = [];
        let whereClause = '';

        if (bankUserId) {
            whereClause += whereClause ? ' AND' : ' WHERE';
            whereClause += ` be.bank_user_id = $${queryParams.length + 1}`;
            queryParams.push(bankUserId);
        }

        query += whereClause + ' ORDER BY be.created_at DESC';

        const result = await client.query(query, queryParams);

        return NextResponse.json({
            success: true,
            employees: result.rows,
            total: result.rowCount
        });

    } catch (error) {
        console.error('Error fetching bank employees:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function PUT(request) {
    try {
        const body = await req.json();
        const { employee_id, action, ...updateData } = body;

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

        if (!employee_id || !action) {
            return NextResponse.json(
                { success: false, error: 'Employee ID and action are required' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry();
        try {
            await client.query('BEGIN');

            let result;
            let auditAction = '';

            switch (action) {
                case 'update':
                    const { first_name, last_name, position, phone } = updateData;
                    result = await client.query(
                        `UPDATE bank_employees 
                         SET first_name = COALESCE($1, first_name), 
                             last_name = COALESCE($2, last_name), 
                             position = COALESCE($3, position), 
                             phone = COALESCE($4, phone), 
                             updated_at = NOW() 
                         WHERE employee_id = $5 RETURNING *`,
                        [first_name, last_name, position, phone, employee_id]
                    );
                    auditAction = 'account_updated';
                    break;

                default:
                    await client.query('ROLLBACK');
                    return NextResponse.json(
                        { success: false, error: 'Invalid action' },
                        { status: 400 }
                    );
            }

            if (result.rowCount === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'Employee not found' },
                    { status: 404 }
                );
            }

            const employee = result.rows[0];

            // Log the action in audit log
            await client.query(
                `INSERT INTO bank_employee_audit_log (
                    employee_id, 
                    bank_user_id, 
                    action_type, 
                    action_details, 
                    ip_address
                ) VALUES ($1, $2, $3, $4, $5)`,
                [
                    employee_id,
                    employee.bank_user_id,
                    auditAction,
                    `Bank employee account ${action} by admin`,
                    req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
                ]
            );

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: `Employee ${action} successfully`,
                data: employee
            });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Database transaction failed:', err);
            return NextResponse.json(
                { success: false, error: 'Failed to update employee' },
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
