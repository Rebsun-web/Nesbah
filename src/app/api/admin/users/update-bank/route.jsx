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
        const { user_id, user_type, ...updateData } = body;

        if (!user_id) {
            return NextResponse.json(
                { success: false, error: 'user_id is required' },
                { status: 400 }
            );
        }

        if (user_type !== 'bank') {
            return NextResponse.json(
                { success: false, error: 'Invalid user_type for bank update' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_users_update-bank_route.jsx_route');
        
        try {
            await client.query('BEGIN');

            // Check if bank user exists
            const bankCheck = await client.query(
                'SELECT user_id FROM bank_users WHERE user_id = $1',
                [user_id]
            );
            
            if (bankCheck.rowCount === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'Bank user not found' },
                    { status: 404 }
                );
            }

            // Prepare update fields for bank_users table
            const allowedBankFields = [
                'contact_person', 'contact_person_number', 'logo_url', 'credit_limit'
            ];
            
            const bankSetClauses = [];
            const bankUpdateParams = [];
            let paramCount = 0;

            for (const [key, value] of Object.entries(updateData)) {
                if (allowedBankFields.includes(key) && value !== undefined && value !== '') {
                    paramCount++;
                    bankSetClauses.push(`${key} = $${paramCount}`);
                    bankUpdateParams.push(value);
                }
            }

            // Prepare update fields for users table
            const allowedUserFields = ['entity_name', 'email'];
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

            // Update bank_users table if there are fields to update
            if (bankSetClauses.length > 0) {
                bankUpdateParams.push(user_id);
                const bankUpdateQuery = `
                    UPDATE bank_users 
                    SET ${bankSetClauses.join(', ')}
                    WHERE user_id = $${paramCount + 1}
                    RETURNING user_id, contact_person, contact_person_number, logo_url, credit_limit
                `;
                
                await client.query(bankUpdateQuery, bankUpdateParams);
            }

            // Update users table if there are fields to update
            if (userSetClauses.length > 0) {
                userUpdateParams.push(user_id);
                const userUpdateQuery = `
                    UPDATE users 
                    SET ${userSetClauses.join(', ')}
                    WHERE user_id = $${userParamCount + 1}
                    RETURNING user_id, entity_name, email
                `;
                
                await client.query(userUpdateQuery, userUpdateParams);
            }

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Bank user updated successfully',
                data: {
                    user_id,
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
        console.error('Update bank user error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update bank user' },
            { status: 500 }
        );
    }
}
