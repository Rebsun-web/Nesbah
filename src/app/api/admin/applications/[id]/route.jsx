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

        const applicationId = parseInt((await params).id);
        
        if (!applicationId || isNaN(applicationId)) {
            return NextResponse.json({ success: false, error: 'Invalid application ID' }, { status: 400 });
        }

        const client = await pool.connectWithRetry();
        
        try {
            // Get application details
            const applicationQuery = `
                SELECT 
                    pa.application_id,
                    COALESCE(pa.current_application_status, pa.status) as status,
                    pa.submitted_at,
                    pa.auction_end_time,
                    pa.offer_selection_end_time,
                    pa.offers_count,
                    pa.revenue_collected,
                    pa.business_user_id,
                    pa.admin_notes,
                    pa.trade_name,
                    pa.cr_number,
                    pa.cr_national_number,
                    pa.legal_form,
                    pa.registration_status,
                    pa.issue_date_gregorian as issue_date,
                    pa.city,
                    pa.activities,
                    pa.contact_info,
                    pa.has_ecommerce,
                    pa.store_url,
                    pa.cr_capital,
                    pa.cash_capital,
                    pa.management_structure,
                    pa.management_managers as management_names,
                    pa.contact_person,
                    pa.contact_person_number,
                    pa.number_of_pos_devices,
                    pa.city_of_operation,
                    pa.own_pos_system,
                    pa.notes,
                    pa.uploaded_filename,
                    pa.uploaded_mimetype,
                    CASE 
                        WHEN COALESCE(pa.current_application_status, pa.status) = 'live_auction' AND pa.auction_end_time <= NOW() + INTERVAL '1 hour' THEN 'auction_ending_soon'
                        WHEN COALESCE(pa.current_application_status, pa.status) = 'completed' AND pa.offer_selection_end_time <= NOW() + INTERVAL '1 hour' THEN 'selection_ending_soon'
                        WHEN COALESCE(pa.current_application_status, pa.status) = 'live_auction' AND pa.auction_end_time <= NOW() THEN 'auction_expired'
                        WHEN COALESCE(pa.current_application_status, pa.status) = 'completed' AND pa.offer_selection_end_time <= NOW() THEN 'selection_expired'
                        ELSE 'normal'
                    END as urgency_level
                FROM pos_application pa
                WHERE pa.application_id = $1
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

        const applicationId = parseInt((await params).id);
        
        if (!applicationId || isNaN(applicationId)) {
            return NextResponse.json({ success: false, error: 'Invalid application ID' }, { status: 400 });
        }

        const body = await req.json();
        const {
            status,
            admin_notes,
            trade_name,
            cr_number,
            city,
            contact_person,
            contact_person_number,
            notes
        } = body;

        const client = await pool.connectWithRetry();
        
        try {
            await client.query('BEGIN');

            // Update pos_application
            const posUpdateQuery = `
                UPDATE pos_application 
                SET 
                    current_application_status = COALESCE($1, current_application_status),
                    admin_notes = COALESCE($2, admin_notes)
                WHERE application_id = $3
                RETURNING *
            `;
            
            const posResult = await client.query(posUpdateQuery, [
                status, admin_notes, applicationId
            ]);

            if (posResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
            }

            // Also update application status if status is provided
            if (status) {
                // Update pos_application table status
                await client.query(
                    'UPDATE pos_application SET current_application_status = $1 WHERE application_id = $2',
                    [status, applicationId]
                );
                
                // Log the status transition
                await client.query(`
                    INSERT INTO status_audit_log (application_id, from_status, to_status, admin_user_id, reason, timestamp)
                    VALUES ($1, $2, $3, $4, $5, NOW())
                `, [applicationId, 'unknown', status, adminUser.admin_id || 1, 'Admin direct update']);
                
                console.log(`✅ Application ${applicationId} status updated to ${status} by admin`);
            }

            // Update POS application details if fields provided
            if (trade_name || cr_number || city || contact_person || contact_person_number || notes) {
                const posDetailsUpdateQuery = `
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
                
                await client.query(posDetailsUpdateQuery, [
                    trade_name, cr_number, city, contact_person, contact_person_number, notes, applicationId
                ]);
            }

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Application updated successfully',
                data: {
                    application_id: applicationId,
                    status: posResult.rows[0].current_application_status,
                    admin_notes: posResult.rows[0].admin_notes,
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

        const applicationId = parseInt((await params).id);
        
        if (!applicationId || isNaN(applicationId)) {
            return NextResponse.json({ success: false, error: 'Invalid application ID' }, { status: 400 });
        }

        const client = await pool.connectWithRetry();
        
        try {
            await client.query('BEGIN');

            // Check if application exists
            const checkQuery = `SELECT application_id FROM pos_application WHERE application_id = $1`;
            const checkResult = await client.query(checkQuery, [applicationId]);
            
            if (checkResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
            }

            // Delete related records first (in reverse order of dependencies)
            await client.query(`DELETE FROM application_offers WHERE submitted_application_id = $1`, [applicationId]);
            await client.query(`DELETE FROM status_audit_log WHERE application_id = $1`, [applicationId]);
            await client.query(`DELETE FROM pos_application WHERE application_id = $1`, [applicationId]);

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
