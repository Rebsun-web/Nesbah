import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

export async function DELETE(req) {
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

        // Get admin user from session (no database query needed)
        const adminUser = sessionValidation.adminUser;
        console.log('🔧 Admin delete-bank-employee API: Authentication successful for admin:', adminUser.email);

        const body = await req.json();
        const { employee_id } = body;

        if (!employee_id) {
            return NextResponse.json(
                { success: false, error: 'employee_id is required' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_users_delete-bank-employee_route.jsx_route');
        try {
            await client.query('BEGIN');

            console.log(`🗑️ Starting deletion for bank employee: ${employee_id}`);

            // 1. Get employee details to find the user_id
            const employeeResult = await client.query(
                'SELECT user_id FROM bank_employees WHERE employee_id = $1',
                [employee_id]
            );
            
            if (employeeResult.rowCount === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'Bank employee not found' },
                    { status: 404 }
                );
            }

            const userId = employeeResult.rows[0].user_id;
            console.log(`👤 Found employee with user_id: ${userId}`);

            // 2. Delete bank employee record
            const employeeDeleteResult = await client.query(
                'DELETE FROM bank_employees WHERE employee_id = $1',
                [employee_id]
            );
            console.log(`👥 Deleted bank employee record`);

            // 3. Delete user record
            const userDeleteResult = await client.query(
                'DELETE FROM users WHERE user_id = $1',
                [userId]
            );
            console.log(`👤 Deleted user record`);

            await client.query('COMMIT');

            console.log(`✅ Bank employee deletion completed successfully: ${employee_id}`);

            return NextResponse.json({
                success: true,
                message: 'Bank employee deleted successfully',
                deletedData: {
                    bank_employee: true,
                    user: true
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error during bank employee deletion:', error);
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('❌ Bank employee deletion error:', error);
        return NextResponse.json(
            { success: false, error: `Failed to delete bank employee: ${error.message}` },
            { status: 500 }
        );
    }
}
