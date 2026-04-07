import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';
import { auctionConfig } from '@/lib/config/auction-config';

import { cascadeDeleteApplication } from '@/lib/cascade-deletion';

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

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_applications_[id]_route.jsx_route');
        
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
                    pa.pos_provider_name,
                    pa.pos_age_duration_months,
                    pa.avg_monthly_pos_sales,
                    pa.requested_financing_amount,
                    pa.preferred_repayment_period_months,
                    pa.notes,
                    pa.uploaded_filename,
                    pa.uploaded_mimetype,
                    pa.assigned_user_id,
                    -- Business user information
                    u.email as business_email,
                    -- Assigned user information (if assigned to a bank)
                    assigned_u.entity_name as assigned_trade_name,
                    assigned_u.email as assigned_email,
                    assigned_bu.logo_url as assigned_logo_url,
                    assigned_u.user_type as assigned_user_type,
                    CASE 
                        WHEN COALESCE(pa.current_application_status, pa.status) = 'live_auction' AND pa.auction_end_time <= NOW() + INTERVAL '1 hour' THEN 'auction_ending_soon'
                        WHEN COALESCE(pa.current_application_status, pa.status) = 'completed' AND pa.offer_selection_end_time <= NOW() + INTERVAL '1 hour' THEN 'selection_ending_soon'
                        WHEN COALESCE(pa.current_application_status, pa.status) = 'live_auction' AND pa.auction_end_time <= NOW() THEN 'auction_expired'
                        WHEN COALESCE(pa.current_application_status, pa.status) = 'completed' AND pa.offer_selection_end_time <= NOW() THEN 'selection_expired'
                        ELSE 'normal'
                    END as urgency_level
                FROM pos_application pa
                LEFT JOIN business_users bu ON pa.business_user_id = bu.user_id
                LEFT JOIN users u ON bu.user_id = u.user_id
                LEFT JOIN bank_users assigned_bu ON pa.assigned_user_id = assigned_bu.user_id
                LEFT JOIN users assigned_u ON assigned_bu.user_id = assigned_u.user_id
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
    let applicationId; // Define outside try block for error logging
    
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

        applicationId = parseInt((await params).id);
        
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
            city_of_operation,
            contact_person,
            contact_person_number,
            business_contact_email,
            notes,
            financing_type,
            approximate_financing_amount,
            sector,
            pos_provider_name,
            pos_age_duration_months,
            avg_monthly_pos_sales,
            requested_financing_amount,
            preferred_repayment_period_months,
            uploaded_document,
            uploaded_filename,
            uploaded_mimetype,
            reset_auction,
            assigned_user_id
        } = body;

        // Validate and convert numeric fields
        const validatedPosAgeDurationMonths = pos_age_duration_months === '' || pos_age_duration_months === null ? null : parseInt(pos_age_duration_months);
        const validatedAvgMonthlyPosSales = avg_monthly_pos_sales === '' || avg_monthly_pos_sales === null ? null : parseInt(avg_monthly_pos_sales);
        const validatedRequestedFinancingAmount = requested_financing_amount === '' || requested_financing_amount === null ? null : parseInt(requested_financing_amount);
        const validatedPreferredRepaymentPeriodMonths = preferred_repayment_period_months === '' || preferred_repayment_period_months === null ? null : parseInt(preferred_repayment_period_months);
        const validatedAssignedUserId = assigned_user_id === '' || assigned_user_id === null ? null : parseInt(assigned_user_id);

        // Validate numeric fields
        if (pos_age_duration_months !== undefined && pos_age_duration_months !== '' && isNaN(validatedPosAgeDurationMonths)) {
            return NextResponse.json({ success: false, error: 'Invalid POS age duration months' }, { status: 400 });
        }
        if (avg_monthly_pos_sales !== undefined && avg_monthly_pos_sales !== '' && isNaN(validatedAvgMonthlyPosSales)) {
            return NextResponse.json({ success: false, error: 'Invalid average monthly POS sales' }, { status: 400 });
        }
        if (requested_financing_amount !== undefined && requested_financing_amount !== '' && isNaN(validatedRequestedFinancingAmount)) {
            return NextResponse.json({ success: false, error: 'Invalid requested financing amount' }, { status: 400 });
        }
        if (preferred_repayment_period_months !== undefined && preferred_repayment_period_months !== '' && isNaN(validatedPreferredRepaymentPeriodMonths)) {
            return NextResponse.json({ success: false, error: 'Invalid preferred repayment period months' }, { status: 400 });
        }
        if (assigned_user_id !== undefined && assigned_user_id !== '' && isNaN(validatedAssignedUserId)) {
            return NextResponse.json({ success: false, error: 'Invalid assigned user ID' }, { status: 400 });
        }

        const client = await pool.connectWithRetry(3, 2000, 'app_api_admin_applications_[id]_route.jsx_route');
        
        try {
            await client.query('BEGIN');

            // Build dynamic UPDATE query for editable fields
            const updateFields = [];
            const updateValues = [];
            let paramCount = 1;

            if (status !== undefined) {
                updateFields.push(`current_application_status = $${paramCount++}`);
                updateValues.push(status);
            }
            if (admin_notes !== undefined) {
                updateFields.push(`admin_notes = $${paramCount++}`);
                updateValues.push(admin_notes);
            }
            if (validatedAssignedUserId !== undefined) {
                updateFields.push(`assigned_user_id = $${paramCount++}`);
                updateValues.push(validatedAssignedUserId);
            }
            if (trade_name !== undefined) {
                updateFields.push(`trade_name = $${paramCount++}`);
                updateValues.push(trade_name);
            }
            if (cr_number !== undefined) {
                updateFields.push(`cr_number = $${paramCount++}`);
                updateValues.push(cr_number);
            }
            if (city !== undefined) {
                updateFields.push(`city = $${paramCount++}`);
                updateValues.push(city);
            }
            if (city_of_operation !== undefined) {
                updateFields.push(`city_of_operation = $${paramCount++}`);
                updateValues.push(city_of_operation);
            }
            if (financing_type !== undefined) {
                updateFields.push(`financing_type = $${paramCount++}`);
                updateValues.push(financing_type);
            }
            if (approximate_financing_amount !== undefined) {
                updateFields.push(`approximate_financing_amount = $${paramCount++}`);
                updateValues.push(approximate_financing_amount || null);
            }
            if (sector !== undefined) {
                updateFields.push(`sector = $${paramCount++}`);
                updateValues.push(sector || null);
            }
            if (contact_person !== undefined) {
                updateFields.push(`contact_person = $${paramCount++}`);
                updateValues.push(contact_person);
            }
            if (contact_person_number !== undefined) {
                updateFields.push(`contact_person_number = $${paramCount++}`);
                updateValues.push(contact_person_number);
            }
            if (notes !== undefined) {
                updateFields.push(`notes = $${paramCount++}`);
                updateValues.push(notes);
            }
            if (pos_provider_name !== undefined) {
                updateFields.push(`pos_provider_name = $${paramCount++}`);
                updateValues.push(pos_provider_name);
            }
            if (validatedPosAgeDurationMonths !== undefined) {
                updateFields.push(`pos_age_duration_months = $${paramCount++}`);
                updateValues.push(validatedPosAgeDurationMonths);
            }
            if (validatedAvgMonthlyPosSales !== undefined) {
                updateFields.push(`avg_monthly_pos_sales = $${paramCount++}`);
                updateValues.push(validatedAvgMonthlyPosSales);
            }
            if (validatedRequestedFinancingAmount !== undefined) {
                updateFields.push(`requested_financing_amount = $${paramCount++}`);
                updateValues.push(validatedRequestedFinancingAmount);
            }
            if (validatedPreferredRepaymentPeriodMonths !== undefined) {
                updateFields.push(`preferred_repayment_period_months = $${paramCount++}`);
                updateValues.push(validatedPreferredRepaymentPeriodMonths);
            }
            // Handle file upload (base64)
            if (uploaded_document !== undefined) {
                updateFields.push(`uploaded_document = $${paramCount++}`);
                updateValues.push(uploaded_document ? Buffer.from(uploaded_document, 'base64') : null);
            }
            if (uploaded_filename !== undefined) {
                updateFields.push(`uploaded_filename = $${paramCount++}`);
                updateValues.push(uploaded_filename);
            }
            if (uploaded_mimetype !== undefined) {
                updateFields.push(`uploaded_mimetype = $${paramCount++}`);
                updateValues.push(uploaded_mimetype);
            }

            if (updateFields.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
            }

            // Add application_id as the last parameter
            updateValues.push(applicationId);

            const posUpdateQuery = `
                UPDATE pos_application 
                SET ${updateFields.join(', ')}
                WHERE application_id = $${paramCount}
                RETURNING *
            `;
            
            const posResult = await client.query(posUpdateQuery, updateValues);

            if (posResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
            }

            // Log the status transition if status is provided
            if (status) {
                // Get the previous status for logging
                const previousStatusQuery = 'SELECT current_application_status FROM pos_application WHERE application_id = $1';
                const previousStatusResult = await client.query(previousStatusQuery, [applicationId]);
                const previousStatus = previousStatusResult.rows[0]?.current_application_status || 'unknown';
                
                // Log the status transition
                await client.query(`
                    INSERT INTO status_audit_log (application_id, from_status, to_status, admin_user_id, reason, timestamp)
                    VALUES ($1, $2, $3, $4, $5, NOW())
                `, [applicationId, previousStatus, status, adminUser.admin_id || 1, 'Admin direct update']);
                
                console.log(`✅ Application ${applicationId} status updated to ${status} by admin`);
            }

            // Reset auction timer if requested and status is live_auction
            if (reset_auction && status === 'live_auction') {
                // Get current application status for logging purposes
                const currentStatusQuery = 'SELECT current_application_status FROM pos_application WHERE application_id = $1';
                const currentStatusResult = await client.query(currentStatusQuery, [applicationId]);
                const currentStatus = currentStatusResult.rows[0]?.current_application_status;
                
                // Always reset timer when status is live_auction (whether changing or staying the same)
                const newEndTime = new Date();
                newEndTime.setTime(newEndTime.getTime() + auctionConfig.durationMilliseconds); // Configured duration from now
                
                await client.query(
                    'UPDATE pos_application SET auction_end_time = $1 WHERE application_id = $2',
                    [newEndTime, applicationId]
                );
                
                if (currentStatus !== 'live_auction') {
                    console.log(`✅ Application ${applicationId} auction timer reset to ${newEndTime} (status changed from ${currentStatus} to live_auction)`);
                } else {
                    console.log(`✅ Application ${applicationId} auction timer reset to ${newEndTime} (status remains live_auction)`);
                }
            } else if (reset_auction && status !== 'live_auction') {
                console.log(`⚠️ Application ${applicationId}: reset_auction requested but status is not 'live_auction' (${status}), ignoring reset`);
            }

            // Update business_contact_email on pos_application if provided
            if (business_contact_email !== undefined) {
                await client.query(
                    'UPDATE pos_application SET business_contact_email = $1 WHERE application_id = $2',
                    [business_contact_email || null, applicationId]
                );
            }

            // Update POS application details if fields provided
            if (trade_name || cr_number || city || contact_person || contact_person_number || notes || 
                pos_provider_name || pos_age_duration_months || avg_monthly_pos_sales || requested_financing_amount || 
                preferred_repayment_period_months || uploaded_filename) {
                const posDetailsUpdateQuery = `
                    UPDATE pos_application 
                    SET 
                        trade_name = COALESCE($1, trade_name),
                        cr_number = COALESCE($2, cr_number),
                        city = COALESCE($3, city),
                        contact_person = COALESCE($4, contact_person),
                        contact_person_number = COALESCE($5, contact_person_number),
                        notes = COALESCE($6, notes),
                        pos_provider_name = COALESCE($7, pos_provider_name),
                        pos_age_duration_months = COALESCE($8, pos_age_duration_months),
                        avg_monthly_pos_sales = COALESCE($9, avg_monthly_pos_sales),
                        requested_financing_amount = COALESCE($10, requested_financing_amount),
                        preferred_repayment_period_months = COALESCE($11, preferred_repayment_period_months),
                        uploaded_filename = COALESCE($12, uploaded_filename)
                    WHERE application_id = $13
                `;
                
                await client.query(posDetailsUpdateQuery, [
                    trade_name, cr_number, city, contact_person, contact_person_number, notes,
                    pos_provider_name, validatedPosAgeDurationMonths, validatedAvgMonthlyPosSales, validatedRequestedFinancingAmount,
                    validatedPreferredRepaymentPeriodMonths, uploaded_filename, applicationId
                ]);
            }

            // Clean up live auction application data if it's being edited
            if (status === 'live_auction' || (status === undefined && posResult.rows[0].current_application_status === 'live_auction')) {
                // Check if any application details were actually changed
                const hasChanges = trade_name !== undefined || cr_number !== undefined || city !== undefined || 
                                 contact_person !== undefined || contact_person_number !== undefined || notes !== undefined ||
                                 pos_provider_name !== undefined || pos_age_duration_months !== undefined || 
                                 avg_monthly_pos_sales !== undefined || requested_financing_amount !== undefined ||
                                 preferred_repayment_period_months !== undefined || uploaded_filename !== undefined;

                if (hasChanges) {
                    // Get count of existing offers before deletion
                    const offersCountQuery = 'SELECT COUNT(*) as count FROM application_offers WHERE submitted_application_id = $1';
                    const offersCountResult = await client.query(offersCountQuery, [applicationId]);
                    const offersCount = offersCountResult.rows[0].count;

                    if (offersCount > 0) {
                        // Delete all existing offers for this application
                        await client.query(
                            'DELETE FROM application_offers WHERE submitted_application_id = $1',
                            [applicationId]
                        );

                        // Reset offers count in pos_application
                        await client.query(
                            'UPDATE pos_application SET offers_count = 0 WHERE application_id = $1',
                            [applicationId]
                        );

                        console.log(`🗑️ Application ${applicationId}: Removed ${offersCount} previous offers due to live auction application edit`);
                    } else {
                        console.log(`ℹ️ Application ${applicationId}: No previous offers to remove`);
                    }

                    // Clean opened_by and purchased_by arrays
                    await client.query(
                        'UPDATE pos_application SET opened_by = ARRAY[]::integer[], purchased_by = ARRAY[]::integer[] WHERE application_id = $1',
                        [applicationId]
                    );

                    console.log(`🧹 Application ${applicationId}: Cleaned opened_by and purchased_by arrays due to live auction application edit`);
                } else {
                    console.log(`ℹ️ Application ${applicationId}: Live auction application edited but no details changed, keeping existing data`);
                }
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
            console.error('Database transaction error:', {
                error: error.message,
                code: error.code,
                applicationId,
                status,
                timestamp: new Date().toISOString()
            });
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Application update error:', {
            error: error.message,
            code: error.code,
            applicationId: applicationId || 'unknown',
            timestamp: new Date().toISOString(),
            stack: error.stack
        });
        
        // Provide more specific error messages based on error type
        let errorMessage = 'Failed to update application';
        if (error.code === '53300') {
            errorMessage = 'Database connection limit reached. Please try again.';
        } else if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
            errorMessage = 'Database connection lost. Please try again.';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timeout. Please try again.';
        }
        
        return NextResponse.json(
            { success: false, error: errorMessage },
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

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_applications_[id]_route.jsx_route');
        
        try {
            await client.query('BEGIN');

            // Use the cascade deletion utility
            console.log(`🔧 Starting cascade deletion for application ${applicationId}...`);
            const result = await cascadeDeleteApplication(client, applicationId, false);
            console.log(`🔧 Cascade deletion result:`, result);
            
            if (!result.success) {
                await client.query('ROLLBACK');
                return NextResponse.json({ success: false, error: result.error }, { status: 404 });
            }

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
            console.error('Error during cascade deletion:', error);
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
