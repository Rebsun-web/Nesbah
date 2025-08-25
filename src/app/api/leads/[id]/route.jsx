import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { AnalyticsService } from '@/lib/analytics/analytics-service';

export async function GET(req, { params }) {
    const applicationId = parseInt(params.id);
    const bankUserId = parseInt(req.headers.get('x-user-id'));

    console.log('🔍 Parsed applicationId:', applicationId);
    console.log('🔍 Parsed bankUserId:', bankUserId);

    if (!bankUserId) {
        return NextResponse.json({ success: false, error: 'Missing bank user ID' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check application visibility state
        const subAppRes = await client.query(
            `SELECT opened_by, purchased_by FROM submitted_applications WHERE application_id = $1`,
            [applicationId]
        );

        if (subAppRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ success: false, error: 'Submitted application not found' }, { status: 404 });
        }

        const { opened_by = [], purchased_by = [] } = subAppRes.rows[0];
        const isPurchased = purchased_by.includes(parseInt(bankUserId));
        const isOpened = opened_by.includes(parseInt(bankUserId));

        let appQuery = `
            SELECT
                pa.application_id, pa.notes, pa.uploaded_document, pa.uploaded_filename, pa.uploaded_mimetype,
                pa.contact_person, pa.contact_person_number, pa.number_of_pos_devices, pa.city_of_operation,
                pa.own_pos_system, pa.submitted_at,
                bu.trade_name, bu.registration_status, bu.cr_number, bu.cr_national_number,
                bu.form_name, bu.issue_date_gregorian,
                bu.address, bu.sector,
                bu.has_ecommerce, bu.store_url, bu.cr_capital,
                bu.cash_capital, bu.in_kind_capital,
                bu.management_structure, bu.management_managers,
                bu.contact_info,
                -- Additional personal details not provided by Wathiq API
                pa.contact_person as business_contact_person,
                pa.contact_person_number as business_contact_telephone,
                u.email as business_contact_email
            FROM pos_application pa
                     JOIN business_users bu ON pa.user_id = bu.user_id
                     JOIN users u ON bu.user_id = u.user_id
            WHERE pa.application_id = $1
        `;

        if (isOpened && !isPurchased) {
            appQuery = appQuery.replace('bu.contact_info', `'{}'::jsonb AS contact_info`);
            appQuery = appQuery.replace('pa.contact_person as business_contact_person,', `'' as business_contact_person,`);
            appQuery = appQuery.replace('pa.contact_person_number as business_contact_telephone,', `'' as business_contact_telephone,`);
            appQuery = appQuery.replace('u.email as business_contact_email', `'' as business_contact_email`);
        }

        if (!isOpened) {
            await client.query(
                `UPDATE submitted_applications
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
            await client.query(
                `UPDATE pos_application
                 SET status = 'purchased'
                 WHERE application_id = $1`,
                [applicationId]
            );
        }

        const appDataRes = await client.query(appQuery, [applicationId]);

        const submittedAppIdRes = await client.query(
            `SELECT id FROM submitted_applications WHERE application_id = $1`,
            [applicationId]
        );

        if (submittedAppIdRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ success: false, error: 'No submitted application found for this application ID' }, { status: 404 });
        }

        const submittedAppId = submittedAppIdRes.rows[0].id;

        const offerRes = await client.query(
            `SELECT ao.*, u.entity_name
             FROM application_offers ao
                      JOIN submitted_applications sa ON ao.submitted_application_id = sa.id
                      JOIN users u ON u.user_id = ANY(sa.purchased_by)
             WHERE ao.submitted_application_id = $1
               AND u.user_id = $2
             ORDER BY ao.submitted_at DESC`,
            [submittedAppId, bankUserId]
        );

        console.log('✅ offer_data rows:', offerRes.rows);

        // Fetch rejection data if any
        const rejectionRes = await client.query(
            `SELECT ar.*, u.entity_name
             FROM application_rejections ar
                      JOIN submitted_applications sa ON ar.submitted_application_id = sa.id
                      JOIN users u ON u.user_id = ANY(sa.ignored_by)
             WHERE ar.submitted_application_id = $1
             ORDER BY ar.timestamp DESC
             LIMIT 1`,
            [submittedAppId]
        );

        await client.query('COMMIT');

        return NextResponse.json({
            success: true,
            data: appDataRes.rows[0],
            offer_data: offerRes.rows[0] || null,
            rejection_data: rejectionRes.rows[0] || null,
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error fetching lead details:', err);
        return NextResponse.json({ success: false, error: 'Failed to fetch lead details' }, { status: 500 });
    } finally {
        client.release();
    }
}
