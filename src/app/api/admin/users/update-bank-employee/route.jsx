import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

export async function PUT(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session using session manager
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        const body = await req.json();
        const { employee_id, user_type, ...updateData } = body;

        if (!employee_id) {
            return NextResponse.json(
                { success: false, error: 'employee_id is required' },
                { status: 400 }
            );
        }

        if (user_type !== 'employee') {
            return NextResponse.json(
                { success: false, error: 'Invalid user_type for employee update' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_users_update-bank-employee_route.jsx_route');
        
        try {
            await client.query('BEGIN');

            // Check if bank employee exists
            const employeeCheck = await client.query(
                'SELECT employee_id, user_id FROM bank_employees WHERE employee_id = $1',
                [employee_id]
            );
            
            if (employeeCheck.rowCount === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'Bank employee not found' },
                    { status: 404 }
                );
            }

            const userId = employeeCheck.rows[0].user_id;

            // Prepare update fields for bank_employees table
            const allowedEmployeeFields = [
                'first_name', 'last_name', 'position', 'phone'
            ];
            
            const employeeSetClauses = [];
            const employeeUpdateParams = [];
            let paramCount = 0;

            for (const [key, value] of Object.entries(updateData)) {
                if (allowedEmployeeFields.includes(key) && value !== undefined && value !== '') {
                    paramCount++;
                    employeeSetClauses.push(`${key} = $${paramCount}`);
                    employeeUpdateParams.push(value);
                }
            }

            // Prepare update fields for users table
            const allowedUserFields = ['email'];
            const userSetClauses = [];
            const userUpdateParams = [];
            let userParamCount = 0;

            for (const [key, value] of Object.entries(updateData)) {
                if (allowedUserFields.includes(key) && value !== undefined && value !== '') {
                    userParamCount++;
                    userSetClauses.push(`${key} = $${userParamCount}`);
                    userUpdateParams.push(value);
                }
            }

            // Update bank_employees table if there are fields to update
            if (employeeSetClauses.length > 0) {
                employeeUpdateParams.push(employee_id);
                const employeeUpdateQuery = `
                    UPDATE bank_employees 
                    SET ${employeeSetClauses.join(', ')}
                    WHERE employee_id = $${paramCount + 1}
                    RETURNING employee_id, first_name, last_name, position, phone
                `;
                
                await client.query(employeeUpdateQuery, employeeUpdateParams);
            }

            // Update users table if there are fields to update
            if (userSetClauses.length > 0) {
                userUpdateParams.push(userId);
                const userUpdateQuery = `
                    UPDATE users 
                    SET ${userSetClauses.join(', ')}
                    WHERE user_id = $${userParamCount + 1}
                    RETURNING user_id, email
                `;
                
                await client.query(userUpdateQuery, userUpdateParams);
            }

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Bank employee updated successfully',
                data: {
                    employee_id,
                    ...updateData
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Update bank employee error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update bank employee' },
            { status: 500 }
        );
    }
}
