import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';
import { auctionConfig } from '@/lib/config/auction-config';
import {
    VALID_FINANCING_CODES,
    VALID_AMOUNT_CODES,
    VALID_AGE_CODES,
    VALID_REVENUE_CODES,
    VALID_SECTOR_CODES,
    VALID_CITY_CODES,
    formatAmountRange,
    formatCity,
    formatSector,
    representativeAmount,
} from '@/lib/apply-options';
import { computeLeadScore } from '@/lib/lead-score';

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
                    pa.cr_national_number,
                    -- Wathiq data (canonical source)
                    wd.trade_name,
                    wd.cr_number,
                    wd.legal_form,
                    wd.registration_status,
                    wd.issue_date_gregorian as issue_date,
                    wd.city,
                    wd.activities,
                    wd.contact_info,
                    wd.has_ecommerce,
                    wd.store_url,
                    wd.cr_capital,
                    wd.cash_capital,
                    wd.management_structure,
                    wd.management_managers as management_names,
                    pa.contact_person,
                    pa.contact_person_number,
                    pa.business_contact_email,
                    pa.number_of_pos_devices,
                    pa.city_of_operation,
                    pa.sector,
                    pa.financing_type,
                    pa.approximate_financing_amount,
                    pa.city_code,
                    pa.sector_code,
                    pa.amount_range_code,
                    pa.business_age_range_code,
                    pa.annual_revenue_code,
                    pa.is_pre_revenue,
                    pa.lead_score,
                    pa.lead_tier,
                    pa.own_pos_system,
                    pa.pos_provider_name,
                    pa.pos_age_duration_months,
                    pa.avg_monthly_pos_sales,
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
                LEFT JOIN wathiq_data wd ON wd.cr_national_number = pa.cr_national_number
                LEFT JOIN users u ON pa.user_id = u.user_id
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
            sector,
            // Stable codes — see src/lib/apply-options.js
            city_code,
            sector_code,
            amount_range_code,
            business_age_range_code,
            annual_revenue_code,
            is_pre_revenue,
            own_pos_system,
            pos_provider_name,
            pos_age_duration_months,
            avg_monthly_pos_sales,
            preferred_repayment_period_months,
            uploaded_document,
            uploaded_filename,
            uploaded_mimetype,
            reset_auction,
            assigned_user_id
        } = body;

        // Validate and convert numeric fields.
        // When a field is absent from the request body it arrives as undefined — keep it undefined
        // so the dynamic UPDATE builder skips it. parseInt(undefined) = NaN which crashes Postgres.
        const toInt = (v) => v === undefined ? undefined : (v === '' || v === null ? null : parseInt(v));
        const validatedPosAgeDurationMonths = toInt(pos_age_duration_months);
        const validatedAvgMonthlyPosSales = toInt(avg_monthly_pos_sales);
        const validatedPreferredRepaymentPeriodMonths = toInt(preferred_repayment_period_months);
        const validatedAssignedUserId = toInt(assigned_user_id);

        // Validate numeric fields — only reject if a value was supplied but couldn't be parsed
        if (validatedPosAgeDurationMonths !== undefined && validatedPosAgeDurationMonths !== null && isNaN(validatedPosAgeDurationMonths)) {
            return NextResponse.json({ success: false, error: 'Invalid POS age duration months' }, { status: 400 });
        }
        if (validatedAvgMonthlyPosSales !== undefined && validatedAvgMonthlyPosSales !== null && isNaN(validatedAvgMonthlyPosSales)) {
            return NextResponse.json({ success: false, error: 'Invalid average monthly POS sales' }, { status: 400 });
        }
        if (validatedPreferredRepaymentPeriodMonths !== undefined && validatedPreferredRepaymentPeriodMonths !== null && isNaN(validatedPreferredRepaymentPeriodMonths)) {
            return NextResponse.json({ success: false, error: 'Invalid preferred repayment period months' }, { status: 400 });
        }
        if (validatedAssignedUserId !== undefined && validatedAssignedUserId !== null && isNaN(validatedAssignedUserId)) {
            return NextResponse.json({ success: false, error: 'Invalid assigned user ID' }, { status: 400 });
        }

        // Allow-list checks — current_application_status has no DB-level CHECK
        // constraint, so this is the only thing stopping an arbitrary string being
        // written and breaking downstream status-based logic.
        const VALID_STATUSES = ['live_auction', 'completed', 'ignored'];
        if (status !== undefined && !VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
                { status: 400 }
            );
        }
        // 'general' is retired from the form but must stay editable on legacy rows.
        const EDITABLE_FINANCING_TYPES = [...VALID_FINANCING_CODES, 'general'];
        if (financing_type !== undefined && !EDITABLE_FINANCING_TYPES.includes(financing_type)) {
            return NextResponse.json(
                { success: false, error: `Invalid financing_type. Must be one of: ${EDITABLE_FINANCING_TYPES.join(', ')}` },
                { status: 400 }
            );
        }

        // Enumerated answers: an empty string clears the value, anything else must
        // be a known code. Checked before any DB call.
        const codeFields = [
            ['city_code', city_code, VALID_CITY_CODES],
            ['sector_code', sector_code, VALID_SECTOR_CODES],
            ['amount_range_code', amount_range_code, VALID_AMOUNT_CODES],
            ['business_age_range_code', business_age_range_code, VALID_AGE_CODES],
            ['annual_revenue_code', annual_revenue_code, VALID_REVENUE_CODES],
        ];
        for (const [fieldName, value, validCodes] of codeFields) {
            if (value !== undefined && value !== null && value !== '' && !validCodes.includes(value)) {
                return NextResponse.json(
                    { success: false, error: `Invalid ${fieldName}. Must be one of: ${validCodes.join(', ')}` },
                    { status: 400 }
                );
            }
        }

        if (is_pre_revenue === true && annual_revenue_code) {
            return NextResponse.json(
                { success: false, error: 'annual_revenue_code must be empty when is_pre_revenue is true' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry(3, 2000, 'app_api_admin_applications_[id]_route.jsx_route');
        
        try {
            await client.query('BEGIN');

            // Build dynamic UPDATE query for editable fields
            const updateFields = [];
            const updateValues = [];
            let paramCount = 1;

            // The prioritization indicator is derived from four answers. If an admin
            // edits any of them, recompute it from the merged (existing + incoming)
            // values so the score never drifts out of sync with the row. lead_tier is
            // derived from lead_score by a DB trigger.
            const scoreInputsTouched =
                amount_range_code !== undefined ||
                business_age_range_code !== undefined ||
                own_pos_system !== undefined ||
                is_pre_revenue !== undefined;

            if (scoreInputsTouched) {
                const current = await client.query(
                    `SELECT amount_range_code, business_age_range_code, own_pos_system, is_pre_revenue
                       FROM pos_application WHERE application_id = $1`,
                    [applicationId]
                );
                const row = current.rows[0] || {};
                const merged = {
                    amountCode: amount_range_code !== undefined ? amount_range_code : row.amount_range_code,
                    ageCode: business_age_range_code !== undefined ? business_age_range_code : row.business_age_range_code,
                    hasPos: own_pos_system !== undefined ? own_pos_system : row.own_pos_system,
                    isPreRevenue: is_pre_revenue !== undefined ? is_pre_revenue === true : row.is_pre_revenue === true,
                };
                // No amount and no age means there is nothing meaningful to rank on —
                // clear the score rather than storing a floor value that looks real.
                const score = (merged.amountCode || merged.ageCode) ? computeLeadScore(merged) : null;
                updateFields.push(`lead_score = $${paramCount++}`);
                updateValues.push(score);
            }

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
            // trade_name, cr_number, city are wathiq_data columns — not on pos_application
            if (financing_type !== undefined) {
                updateFields.push(`financing_type = $${paramCount++}`);
                updateValues.push(financing_type);
            }
            // Codes are authoritative; when a code is SET we also refresh the legacy
            // free-text/label column so surfaces still reading it stay correct.
            //
            // Critically, clearing a code must NOT null the legacy column. The edit
            // modal always sends every key, so a pre-migration application (no codes
            // yet) arrives here with empty strings — nulling the legacy columns on
            // that path would destroy the stored city/sector/amount text that is the
            // only thing making those rows renderable. Clearing a code clears the
            // code column and nothing else.
            if (city_code) {
                updateFields.push(`city_code = $${paramCount++}`);
                updateValues.push(city_code);
                updateFields.push(`city_of_operation = $${paramCount++}`);
                updateValues.push(formatCity(city_code, 'ar'));
            } else if (city_code === '' || city_code === null) {
                updateFields.push(`city_code = NULL`);
            } else if (city_of_operation !== undefined) {
                updateFields.push(`city_of_operation = $${paramCount++}`);
                updateValues.push(city_of_operation);
            }
            if (sector_code) {
                updateFields.push(`sector_code = $${paramCount++}`);
                updateValues.push(sector_code);
                updateFields.push(`sector = $${paramCount++}`);
                updateValues.push(formatSector(sector_code, 'ar'));
            } else if (sector_code === '' || sector_code === null) {
                updateFields.push(`sector_code = NULL`);
            } else if (sector !== undefined) {
                updateFields.push(`sector = $${paramCount++}`);
                updateValues.push(sector || null);
            }
            if (amount_range_code) {
                updateFields.push(`amount_range_code = $${paramCount++}`);
                updateValues.push(amount_range_code);
                updateFields.push(`approximate_financing_amount = $${paramCount++}`);
                updateValues.push(formatAmountRange(amount_range_code, 'ar'));
                updateFields.push(`requested_financing_amount = $${paramCount++}`);
                updateValues.push(representativeAmount(amount_range_code));
            } else if (amount_range_code === '' || amount_range_code === null) {
                updateFields.push(`amount_range_code = NULL`);
            }
            if (business_age_range_code !== undefined) {
                updateFields.push(`business_age_range_code = $${paramCount++}`);
                updateValues.push(business_age_range_code || null);
            }
            if (annual_revenue_code !== undefined || is_pre_revenue === true) {
                // Enforce the XOR at the write layer too: pre-revenue always wins.
                updateFields.push(`annual_revenue_code = $${paramCount++}`);
                updateValues.push(is_pre_revenue === true ? null : (annual_revenue_code || null));
            }
            if (is_pre_revenue !== undefined) {
                updateFields.push(`is_pre_revenue = $${paramCount++}`);
                updateValues.push(is_pre_revenue === true);
            }
            if (own_pos_system !== undefined) {
                updateFields.push(`own_pos_system = $${paramCount++}`);
                updateValues.push(typeof own_pos_system === 'boolean' ? own_pos_system : null);
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

            // Clean up live auction application data if it's being edited
            if (status === 'live_auction' || (status === undefined && posResult.rows[0].current_application_status === 'live_auction')) {
                // Check if any application details were actually changed
                const hasChanges = trade_name !== undefined || cr_number !== undefined || city !== undefined || 
                                 contact_person !== undefined || contact_person_number !== undefined || notes !== undefined ||
                                 pos_provider_name !== undefined || pos_age_duration_months !== undefined || 
                                 avg_monthly_pos_sales !== undefined || approximate_financing_amount !== undefined ||
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
