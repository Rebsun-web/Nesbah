import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

// GET - Get specific application by ID
export async function GET(req, { params }) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Verify admin token
        const decoded = AdminAuth.verifyToken(adminToken);
        if (!decoded) {
            return NextResponse.json({ success: false, error: 'Invalid admin token' }, { status: 401 });
        }

        // Get admin user from database
        const adminUser = await AdminAuth.getAdminById(decoded.admin_id);
        if (!adminUser || !adminUser.is_active) {
            return NextResponse.json({ success: false, error: 'Admin user not found or inactive' }, { status: 401 });
        }

        const applicationId = parseInt(params.id);
        
        if (!applicationId || isNaN(applicationId)) {
            return NextResponse.json({ success: false, error: 'Invalid application ID' }, { status: 400 });
        }

        const client = await pool.connect();
        
        try {
            // Get application details
            const applicationQuery = `
                SELECT 
                    sa.application_id,
                    sa.status,
                    sa.submitted_at,
                    sa.auction_end_time,
                    sa.offer_selection_end_time,
                    sa.offers_count,
                    sa.revenue_collected,
                    sa.business_user_id,
                    sa.assigned_user_id,
                    sa.admin_notes,
                    sa.priority_level,
                    sa.last_admin_action,
                    sa.last_admin_user_id,
                    pa.trade_name,
                    pa.cr_number,
                    pa.cr_national_number,
                    pa.legal_form,
                    pa.registration_status,
                    pa.issue_date,
                    pa.city,
                    pa.activities,
                    pa.contact_info,
                    pa.has_ecommerce,
                    pa.store_url,
                    pa.cr_capital,
                    pa.cash_capital,
                    pa.management_structure,
                    pa.management_names,
                    pa.contact_person,
                    pa.contact_person_number,
                    pa.number_of_pos_devices,
                    pa.city_of_operation,
                    pa.own_pos_system,
                    pa.notes,
                    pa.uploaded_filename,
                    pa.uploaded_mimetype,
                    assigned_bu.trade_name as assigned_trade_name,
                    assigned_u.email as assigned_email,
                    CASE 
                        WHEN sa.status = 'pending_offers' AND sa.auction_end_time <= NOW() + INTERVAL '1 hour' THEN 'auction_ending_soon'
                        WHEN sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW() + INTERVAL '1 hour' THEN 'selection_ending_soon'
                        WHEN sa.status = 'pending_offers' AND sa.auction_end_time <= NOW() THEN 'auction_expired'
                        WHEN sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW() THEN 'selection_expired'
                        ELSE 'normal'
                    END as urgency_level
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                LEFT JOIN business_users assigned_bu ON sa.assigned_user_id = assigned_bu.user_id
                LEFT JOIN users assigned_u ON assigned_bu.user_id = assigned_u.user_id
                WHERE sa.application_id = $1
            `;
            
            const applicationResult = await client.query(applicationQuery, [applicationId]);
            
            if (applicationResult.rows.length === 0) {
                return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
            }

            const application = applicationResult.rows[0];

            // Get offers for this application
            const offersQuery = `
                SELECT 
                    ao.offer_id,
                    ao.submitted_application_id,
                    ao.deal_value as offer_amount,
                    ao.offer_device_setup_fee as setup_fee,
                    ao.offer_transaction_fee_mada as transaction_fee_mada,
                    ao.offer_transaction_fee_visa_mc as transaction_fee_visa_mc,
                    ao.status,
                    ao.submitted_by_user_id,
                    ao.submitted_at,
                    ao.admin_notes,
                    u.email as bank_email,
                    'Bank User' as bank_name
                FROM application_offers ao
                LEFT JOIN users u ON ao.submitted_by_user_id = u.user_id
                WHERE ao.submitted_application_id = $1
                ORDER BY ao.submitted_at DESC
            `;
            
            const offersResult = await client.query(offersQuery, [applicationId]);
            application.offers = offersResult.rows;

            // Get audit log for this application
            const auditQuery = `
                SELECT 
                    sal.log_id,
                    sal.from_status,
                    sal.to_status,
                    sal.reason,
                    sal.timestamp,
                    au.full_name as admin_name,
                    au.email as admin_email
                FROM status_audit_log sal
                LEFT JOIN admin_users au ON sal.admin_user_id = au.admin_id
                WHERE sal.application_id = $1
                ORDER BY sal.timestamp DESC
                LIMIT 50
            `;
            
            const auditResult = await client.query(auditQuery, [applicationId]);
            application.audit_log = auditResult.rows;

            return NextResponse.json({
                success: true,
                data: application
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Application details error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch application details' },
            { status: 500 }
        );
    }
}

// PUT - Update application
export async function PUT(req, { params }) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Verify admin token
        const decoded = AdminAuth.verifyToken(adminToken);
        if (!decoded) {
            return NextResponse.json({ success: false, error: 'Invalid admin token' }, { status: 401 });
        }

        // Get admin user from database
        const adminUser = await AdminAuth.getAdminById(decoded.admin_id);
        if (!adminUser || !adminUser.is_active) {
            return NextResponse.json({ success: false, error: 'Admin user not found or inactive' }, { status: 401 });
        }

        const applicationId = parseInt(params.id);
        
        if (!applicationId || isNaN(applicationId)) {
            return NextResponse.json({ success: false, error: 'Invalid application ID' }, { status: 400 });
        }

        const body = await req.json();
        const {
            status,
            admin_notes,
            priority_level,
            trade_name,
            cr_number,
            city,
            contact_person,
            contact_person_number,
            notes,
            assigned_user_id
        } = body;

        // Validate assigned user if provided
        if (assigned_user_id) {
            const assignedUserCheck = await pool.query(
                'SELECT user_id FROM business_users WHERE user_id = $1',
                [assigned_user_id]
            );
            if (assignedUserCheck.rows.length === 0) {
                return NextResponse.json({ success: false, error: 'Invalid assigned user ID' }, { status: 400 });
            }
        }

        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Update submitted application
            const submittedUpdateQuery = `
                UPDATE submitted_applications 
                SET 
                    status = COALESCE($1, status),
                    admin_notes = COALESCE($2, admin_notes),
                    priority_level = COALESCE($3, priority_level),
                    last_admin_action = NOW(),
                    last_admin_user_id = $4,
                    assigned_user_id = COALESCE($5, assigned_user_id)
                WHERE application_id = $6
                RETURNING *
            `;
            
            const submittedResult = await client.query(submittedUpdateQuery, [
                status, admin_notes, priority_level, adminUser.admin_id, assigned_user_id, applicationId
            ]);

            if (submittedResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
            }

            // Update POS application if fields provided
            if (trade_name || cr_number || city || contact_person || contact_person_number || notes) {
                const posUpdateQuery = `
                    UPDATE pos_application 
                    SET 
                        trade_name = COALESCE($1, trade_name),
                        cr_number = COALESCE($2, cr_number),
                        city = COALESCE($3, city),
                        contact_person = COALESCE($4, contact_person),
                        contact_person_number = COALESCE($5, contact_person_number),
                        notes = COALESCE($6, notes)
                    WHERE application_id = $7
                `;
                
                await client.query(posUpdateQuery, [
                    trade_name, cr_number, city, contact_person, contact_person_number, notes, applicationId
                ]);
            }

            // Log the update
            await client.query(
                `INSERT INTO admin_audit_log (action, table_name, record_id, admin_user_id, details, timestamp)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                ['UPDATE', 'submitted_applications', applicationId, adminUser.admin_id, JSON.stringify(body)]
            );

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Application updated successfully',
                data: {
                    application_id: applicationId,
                    status: submittedResult.rows[0].status,
                    admin_notes: submittedResult.rows[0].admin_notes,
                    priority_level: submittedResult.rows[0].priority_level,
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
        console.error('Application update error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update application' },
            { status: 500 }
        );
    }
}

// DELETE - Delete application
export async function DELETE(req, { params }) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Verify admin token
        const decoded = AdminAuth.verifyToken(adminToken);
        if (!decoded) {
            return NextResponse.json({ success: false, error: 'Invalid admin token' }, { status: 401 });
        }

        // Get admin user from database
        const adminUser = await AdminAuth.getAdminById(decoded.admin_id);
        if (!adminUser || !adminUser.is_active) {
            return NextResponse.json({ success: false, error: 'Admin user not found or inactive' }, { status: 401 });
        }

        const applicationId = parseInt(params.id);
        
        if (!applicationId || isNaN(applicationId)) {
            return NextResponse.json({ success: false, error: 'Invalid application ID' }, { status: 400 });
        }

        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Check if application exists
            const checkQuery = `SELECT application_id FROM submitted_applications WHERE application_id = $1`;
            const checkResult = await client.query(checkQuery, [applicationId]);
            
            if (checkResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
            }

            // Delete related records first (in reverse order of dependencies)
            await client.query(`DELETE FROM application_offers WHERE submitted_application_id = $1`, [applicationId]);
            await client.query(`DELETE FROM status_audit_log WHERE application_id = $1`, [applicationId]);
            await client.query(`DELETE FROM submitted_applications WHERE application_id = $1`, [applicationId]);
            await client.query(`DELETE FROM pos_application WHERE application_id = $1`, [applicationId]);

            // Log the deletion
            await client.query(
                `INSERT INTO admin_audit_log (action, table_name, record_id, admin_user_id, details, timestamp)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                ['DELETE', 'pos_application', applicationId, adminUser.admin_id, JSON.stringify({ application_id: applicationId })]
            );

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Application deleted successfully',
                data: {
                    application_id: applicationId,
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
        console.error('Application deletion error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete application' },
            { status: 500 }
        );
    }
}
