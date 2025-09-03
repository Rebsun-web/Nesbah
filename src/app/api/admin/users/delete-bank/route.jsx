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
        console.log('🔧 Admin delete-bank API: Authentication successful for admin:', adminUser.email);

        const body = await req.json();
        const { user_id } = body;

        if (!user_id) {
            return NextResponse.json(
                { success: false, error: 'user_id is required' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_users_delete-bank_route.jsx_route');
        try {
            await client.query('BEGIN');

            console.log(`🗑️ Starting cascade deletion for bank user: ${user_id}`);

            // 1. Get all bank employees for this bank
            const employeesResult = await client.query(
                'SELECT employee_id FROM bank_employees WHERE bank_user_id = $1',
                [user_id]
            );
            const employeeIds = employeesResult.rows.map(row => row.employee_id);
            
            if (employeeIds.length > 0) {
                console.log(`👥 Found ${employeeIds.length} bank employees to delete`);
                
                // 2. Delete all bank employees
                const employeesDeleteResult = await client.query(
                    'DELETE FROM bank_employees WHERE bank_user_id = $1',
                    [user_id]
                );
                console.log(`👥 Deleted ${employeesDeleteResult.rowCount} bank employees`);
                
                // 3. Delete user records for employees
                const employeeUsersDeleteResult = await client.query(
                    'DELETE FROM users WHERE user_id = ANY($1)',
                    [employeeIds]
                );
                console.log(`👤 Deleted ${employeeUsersDeleteResult.rowCount} employee user records`);
            }

            // 4. Get all offers submitted by this bank
            const offersResult = await client.query(
                'SELECT offer_id FROM application_offers WHERE bank_user_id = $1',
                [user_id]
            );
            const offerIds = offersResult.rows.map(row => row.offer_id);
            
            if (offerIds.length > 0) {
                console.log(`💸 Found ${offerIds.length} offers to delete`);
                
                // 5. Delete all offers submitted by this bank
                const offersDeleteResult = await client.query(
                    'DELETE FROM application_offers WHERE bank_user_id = $1',
                    [user_id]
                );
                console.log(`💸 Deleted ${offersDeleteResult.rowCount} offers`);
            }

            // 6. Delete bank user record
            const bankUserDeleteResult = await client.query(
                'DELETE FROM bank_users WHERE user_id = $1',
                [user_id]
            );
            
            if (bankUserDeleteResult.rowCount === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'Bank user not found' },
                    { status: 404 }
                );
            }
            console.log(`🏦 Deleted bank user record`);

            // 7. Delete user record
            const userDeleteResult = await client.query(
                'DELETE FROM users WHERE user_id = $1',
                [user_id]
            );
            console.log(`👤 Deleted user record`);

            await client.query('COMMIT');

            console.log(`✅ Cascade deletion completed successfully for bank user: ${user_id}`);

            return NextResponse.json({
                success: true,
                message: 'Bank user and all related data deleted successfully',
                deletedData: {
                    bank_user: true,
                    user: true,
                    employees: employeeIds.length,
                    offers: offerIds.length
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error during cascade deletion:', error);
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('❌ Bank user deletion error:', error);
        return NextResponse.json(
            { success: false, error: `Failed to delete bank user: ${error.message}` },
            { status: 500 }
        );
    }
}
