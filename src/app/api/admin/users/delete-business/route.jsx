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
        console.log('🔧 Admin delete-business API: Authentication successful for admin:', adminUser.email);

        const body = await req.json();
        const { user_id } = body;

        if (!user_id) {
            return NextResponse.json(
                { success: false, error: 'user_id is required' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_users_delete-business_route.jsx_route');
        try {
            await client.query('BEGIN');

            console.log(`🗑️ Starting cascade deletion for business user: ${user_id}`);

            // 1. Get all applications for this business user
            const applicationsResult = await client.query(
                'SELECT application_id FROM pos_application WHERE user_id = $1',
                [user_id]
            );
            const applicationIds = applicationsResult.rows.map(row => row.application_id);
            
            if (applicationIds.length > 0) {
                console.log(`📋 Found ${applicationIds.length} applications to delete`);
                
                // 2. Delete all offers for these applications
                const offersDeleteResult = await client.query(
                    'DELETE FROM application_offers WHERE submitted_application_id = ANY($1)',
                    [applicationIds]
                );
                console.log(`💸 Deleted ${offersDeleteResult.rowCount} offers`);
                
                // 3. Delete all applications
                const applicationsDeleteResult = await client.query(
                    'DELETE FROM pos_application WHERE user_id = $1',
                    [user_id]
                );
                console.log(`📄 Deleted ${applicationsDeleteResult.rowCount} applications`);
            }

            // 4. Delete business user record
            const businessUserDeleteResult = await client.query(
                'DELETE FROM business_users WHERE user_id = $1',
                [user_id]
            );
            
            if (businessUserDeleteResult.rowCount === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'Business user not found' },
                    { status: 404 }
                );
            }
            console.log(`🏢 Deleted business user record`);

            // 5. Delete user record
            const userDeleteResult = await client.query(
                'DELETE FROM users WHERE user_id = $1',
                [user_id]
            );
            console.log(`👤 Deleted user record`);

            await client.query('COMMIT');

            console.log(`✅ Cascade deletion completed successfully for business user: ${user_id}`);

            return NextResponse.json({
                success: true,
                message: 'Business user and all related data deleted successfully',
                deletedData: {
                    business_user: true,
                    user: true,
                    applications: applicationIds.length,
                    offers: applicationIds.length > 0 ? 'all related offers' : 'none'
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
        console.error('❌ Business user deletion error:', error);
        return NextResponse.json(
            { success: false, error: `Failed to delete business user: ${error.message}` },
            { status: 500 }
        );
    }
}
