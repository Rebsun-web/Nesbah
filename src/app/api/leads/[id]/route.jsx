import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { AnalyticsService } from '@/lib/analytics/analytics-service';

export async function GET(req, { params }) {
    const applicationId = parseInt((await params).id);
    let bankUserId = parseInt(req.headers.get('x-user-id'));

    console.log('🔍 Parsed applicationId:', applicationId);
    console.log('🔍 Parsed bankUserId:', bankUserId);

    if (!bankUserId) {
        return NextResponse.json({ success: false, error: 'Missing bank user ID' }, { status: 400 });
    }

    try {
        // If this is a bank employee, get the main bank user ID
        if (req.headers.get('x-user-type') === 'bank_employee') {
            try {
                const bankEmployeeResult = await pool.query(
                    'SELECT bank_user_id FROM bank_employees WHERE user_id = $1',
                    [bankUserId]
                );
                
                if (bankEmployeeResult.rows.length > 0) {
                    bankUserId = bankEmployeeResult.rows[0].bank_user_id;
                    console.log('🔍 Updated bankUserId for employee:', bankUserId);
                }
            } catch (error) {
                console.error('Error getting bank user ID for employee:', error);
                return NextResponse.json({ success: false, error: 'Failed to get bank information' }, { status: 500 });
            }
        }

        // UPDATED: Check application visibility state using pos_application table
        const appRes = await pool.query(
            `SELECT opened_by, purchased_by FROM pos_application WHERE application_id = $1`,
            [applicationId]
        );

        if (appRes.rowCount === 0) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
        }

        const { opened_by = [], purchased_by = [] } = appRes.rows[0];
        const isPurchased = purchased_by.includes(parseInt(bankUserId));
        const isOpened = opened_by.includes(parseInt(bankUserId));

        let appQuery = `
            SELECT
                pa.application_id,
                pa.user_id,
                pa.status,
                pa.submitted_at,
                pa.auction_end_time,
                pa.offers_count,
                pa.revenue_collected,
                pa.notes,
                pa.number_of_pos_devices,
                pa.city_of_operation,
                pa.own_pos_system,
                pa.uploaded_filename,
                pa.uploaded_document,
                pa.uploaded_mimetype,
                pa.contact_person,
                pa.contact_person_number,
                
                -- POS Application Specific Fields
                pa.pos_provider_name,
                pa.pos_age_duration_months,
                pa.avg_monthly_pos_sales,
                pa.requested_financing_amount,
                pa.preferred_repayment_period_months,
                pa.has_ecommerce,
                pa.store_url,
                
                -- Business Information (Wathiq API data)
                bu.trade_name,
                bu.cr_number,
                bu.cr_national_number,
                bu.registration_status,
                bu.address,
                bu.sector,
                bu.cr_capital,
                bu.cash_capital,
                bu.in_kind_capital,
                bu.avg_capital,
                bu.legal_form,
                bu.issue_date_gregorian,
                bu.confirmation_date_gregorian,
                bu.management_structure,
                bu.management_managers,
                bu.contact_info,
                bu.activities,
                bu.admin_notes,
                bu.is_verified,
                bu.verification_date,
                
                -- User Information
                u.email as business_contact_email,
                u.entity_name as business_entity_name
            FROM pos_application pa
            JOIN business_users bu ON pa.user_id = bu.user_id
            JOIN users u ON bu.user_id = u.user_id
            WHERE pa.application_id = $1
        `;

        if (isOpened && !isPurchased) {
            // Hide sensitive information for opened but not purchased applications
            appQuery = appQuery.replace('bu.contact_info,', `'{}'::jsonb AS contact_info,`);
            appQuery = appQuery.replace('pa.contact_person as business_contact_person,', `'' as business_contact_person,`);
            appQuery = appQuery.replace('pa.contact_person_number as business_contact_telephone,', `'' as business_contact_person_number,`);
            appQuery = appQuery.replace('u.email as business_contact_email', `'' as business_contact_email`);
            
            // Hide some Wathiq data for opened but not purchased applications
            appQuery = appQuery.replace('bu.management_managers,', `'{}'::jsonb AS management_managers,`);
            appQuery = appQuery.replace('COALESCE(bu.activities, ARRAY[]::text[]) as activities,', `ARRAY[]::text[] AS activities,`);
            appQuery = appQuery.replace('COALESCE(bu.admin_notes, \'\') as admin_notes,', `'' as admin_notes,`);
        }

        if (!isOpened) {
            // UPDATED: Update opened_by array in pos_application table
            await pool.query(
                `UPDATE pos_application
                 SET opened_by = array_append(opened_by, $1)
                 WHERE application_id = $2`,
                [bankUserId, applicationId]
            );
            
            // Track application view for analytics
            try {
                await AnalyticsService.trackApplicationView(applicationId, bankUserId);
            } catch (error) {
                console.error('Failed to track application view:', error);
                // Don't fail the request if analytics tracking fails
            }
        }

        if (isPurchased) {
            await pool.query(
                `UPDATE pos_application
                 SET status = 'completed'
                 WHERE application_id = $1`,
                [applicationId]
            );
        }

        const appDataRes = await pool.query(appQuery, [applicationId]);
        const application = appDataRes.rows[0];

        if (!application) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
        }

        // Get offers for this application
        const offersQuery = `
            SELECT 
                ao.offer_id,
                ao.submitted_application_id,
                ao.deal_value as offer_amount,
                ao.offer_device_setup_fee as setup_fee,
                ao.offer_transaction_fee_mada as transaction_fee_mada,
                ao.offer_transaction_fee_visa_mc as transaction_fee_visa_mc,
                ao.offer_settlement_time_mada,
                ao.offer_settlement_time_visa_mc,
                ao.offer_comment,
                ao.offer_terms,
                ao.status,
                ao.submitted_by_user_id,
                ao.submitted_at,
                ao.expires_at,
                ao.admin_notes,
                ao.uploaded_filename,
                ao.uploaded_mimetype,
                ao.uploaded_document,
                u.email as bank_email,
                u.entity_name as bank_name
            FROM application_offers ao
            LEFT JOIN users u ON ao.submitted_by_user_id = u.user_id
            WHERE ao.submitted_application_id = $1
            ORDER BY ao.submitted_at DESC
        `;
        
        const offersResult = await pool.query(offersQuery, [applicationId]);
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
        
        const auditResult = await pool.query(auditQuery, [applicationId]);
        application.audit_log = auditResult.rows;

        return NextResponse.json({
            success: true,
            data: application
        });

    } catch (error) {
        console.error('Application details error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch application details' },
            { status: 500 }
        );
    }
}
