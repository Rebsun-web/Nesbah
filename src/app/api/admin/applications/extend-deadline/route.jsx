import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

export async function POST(req) {
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

        const body = await req.json();
        const {
            application_id,
            phase, // 'auction' or 'selection'
            extension_hours,
            reason
        } = body;
        
        const admin_user_id = adminUser.admin_id;

        // Validate required fields
        if (!application_id || !phase || !extension_hours || !reason) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: application_id, phase, extension_hours, reason' },
                { status: 400 }
            );
        }

        // Validate phase
        if (!['auction', 'selection'].includes(phase)) {
            return NextResponse.json(
                { success: false, error: 'Phase must be either "auction" or "selection"' },
                { status: 400 }
            );
        }

        // Validate extension hours (reasonable limits)
        if (extension_hours < 1 || extension_hours > 168) { // Max 1 week
            return NextResponse.json(
                { success: false, error: 'Extension hours must be between 1 and 168 (1 week)' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry();
        
        try {
            await client.query('BEGIN');

            // Verify application exists and is in correct status
            const applicationQuery = await client.query(
                'SELECT status, auction_end_time, offer_selection_end_time FROM submitted_applications WHERE application_id = $1',
                [application_id]
            );

            if (applicationQuery.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'Application not found' },
                    { status: 404 }
                );
            }

            const application = applicationQuery.rows[0];

            // Validate phase matches current status
            if (phase === 'auction' && application.status !== 'live_auction') {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'Can only extend auction deadline for applications in live_auction status' },
                    { status: 400 }
                );
            }

            if (phase === 'selection' && application.status !== 'completed') {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'Can only extend selection deadline for applications in completed status' },
                    { status: 400 }
                );
            }

            // Calculate new deadline
            const currentDeadline = phase === 'auction' ? application.auction_end_time : application.offer_selection_end_time;
            const newDeadline = new Date(currentDeadline.getTime() + (extension_hours * 60 * 60 * 1000));

            // Update the deadline
            let updateQuery;
            let updateParams;

            if (phase === 'auction') {
                updateQuery = `
                    UPDATE submitted_applications 
                    SET auction_end_time = $1
                    WHERE application_id = $2
                `;
                updateParams = [newDeadline, application_id];
            } else {
                updateQuery = `
                    UPDATE submitted_applications 
                    SET offer_selection_end_time = $1
                    WHERE application_id = $2
                `;
                updateParams = [newDeadline, application_id];
            }

            await client.query(updateQuery, updateParams);

            // Also update pos_application table
            if (phase === 'auction') {
                await client.query(
                    'UPDATE pos_application SET auction_end_time = $1 WHERE application_id = $2',
                    [newDeadline, application_id]
                );
            } else {
                await client.query(
                    'UPDATE pos_application SET offer_selection_end_time = $1 WHERE application_id = $2',
                    [newDeadline, application_id]
                );
            }

            // Log the deadline extension
            await client.query(
                `
                INSERT INTO auction_deadlines 
                    (application_id, phase, original_deadline, extended_deadline, extension_reason, admin_user_id, timestamp)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                `,
                [application_id, phase, currentDeadline, newDeadline, reason, admin_user_id]
            );

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: `${phase} deadline extended by ${extension_hours} hours for application ${application_id}`,
                data: {
                    application_id,
                    phase,
                    original_deadline: currentDeadline,
                    extended_deadline: newDeadline,
                    extension_hours,
                    reason,
                    admin_user_id,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Admin extend deadline error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to extend deadline' },
            { status: 500 }
        );
    }
}
