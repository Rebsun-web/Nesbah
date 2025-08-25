import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { AnalyticsService } from '@/lib/analytics/analytics-service';

export async function POST(req, { params }) {
    const applicationId = params.id;
    const bankUserId = req.headers.get('x-user-id');

    if (!bankUserId) {
        return NextResponse.json({ success: false, message: 'Missing bank user ID' }, { status: 400 });
    }

    try {
        const formData = await req.formData();
        const action = formData.get('action');

        if (action !== 'approve') {
            return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
        }

        const check = await pool.query(
            `SELECT * FROM submitted_applications
             WHERE application_id = $1 AND $2 = ANY(purchased_by)`,
            [applicationId, bankUserId]
        );

        const alreadyPurchased = check.rowCount > 0;

        if (!alreadyPurchased) {
            // Record revenue collection (25 SAR per purchase)
            await pool.query(
                `INSERT INTO application_revenue (application_id, bank_user_id, amount, transaction_type)
                 VALUES ($1, $2, $3, $4)`,
                [applicationId, bankUserId, 25.00, 'lead_purchase']
            );

            // Update submitted_applications with purchase tracking
            await pool.query(
                `UPDATE submitted_applications
                 SET
                     purchased_by = array_append(purchased_by, $1),
                     revenue_collected = revenue_collected + $2
                 WHERE application_id = $3`,
                [bankUserId, 25.00, applicationId]
            );

            // Keep pos_application status as 'live_auction' - don't change to 'approved_leads'
            // This allows multiple banks to purchase the same application
        }

        const offer_device_setup_fee = formData.get('offer_device_setup_fee');
        const offer_transaction_fee_mada = formData.get('offer_transaction_fee_mada');
        const offer_transaction_fee_visa_mc = formData.get('offer_transaction_fee_visa_mc');
        const offer_settlement_time_mada = formData.get('offer_settlement_time_mada');
        const offer_comment = formData.get('offer_comment');
        const file = formData.get('uploaded_file');

        const hasOfferData =
          offer_device_setup_fee ||
          offer_transaction_fee_mada ||
          offer_transaction_fee_visa_mc ||
          offer_settlement_time_mada ||
          offer_comment;

        if (hasOfferData) {

          let uploadedDocument = null;
          let uploadedMimetype = null;
          let uploadedFilename = null;

          if (file && typeof file.arrayBuffer === 'function') {
            const arrayBuffer = await file.arrayBuffer();
            uploadedDocument = Buffer.from(arrayBuffer);
            uploadedMimetype = file.type;
            uploadedFilename = file.name;
          }

          const result = await pool.query(
            `SELECT id FROM submitted_applications WHERE application_id = $1 AND $2 = ANY(purchased_by)`,
            [applicationId, bankUserId]
          );

          if (result.rowCount > 0) {
            const submittedApplicationId = result.rows[0].id;

            const offerResult = await pool.query(
              `INSERT INTO application_offers (
                submitted_application_id,
                offer_device_setup_fee,
                offer_transaction_fee_mada,
                offer_transaction_fee_visa_mc,
                offer_settlement_time_mada,
                offer_comment,
                uploaded_document,
                uploaded_mimetype,
                uploaded_filename,
                submitted_by_user_id,
                status,
                offer_selection_deadline
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
              RETURNING offer_id`,
              [
                submittedApplicationId,
                offer_device_setup_fee || null,
                offer_transaction_fee_mada || null,
                offer_transaction_fee_visa_mc || null,
                offer_settlement_time_mada || null,
                offer_comment || null,
                uploadedDocument,
                uploadedMimetype,
                uploadedFilename,
                bankUserId,
                'submitted',
                new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
              ]
            );

            // Track offer submission for analytics
            try {
                const offerId = offerResult.rows[0].offer_id;
                await AnalyticsService.trackOfferSubmission(applicationId, bankUserId, offerId);
            } catch (error) {
                console.error('Failed to track offer submission:', error);
                // Don't fail the request if analytics tracking fails
            }

            // The trigger will automatically update the tracking table with offer details

            // Update offers count in submitted_applications
            await pool.query(
              `UPDATE submitted_applications
               SET offers_count = offers_count + 1
               WHERE application_id = $1`,
              [applicationId]
            );

            // Check if this is the first offer - if so, transition to approved_leads
            const offersCountResult = await pool.query(
              `SELECT offers_count FROM submitted_applications WHERE application_id = $1`,
              [applicationId]
            );

            if (offersCountResult.rows[0]?.offers_count === 1) {
              // First offer submitted - transition to approved_leads
              await pool.query(
                `UPDATE submitted_applications SET status = 'approved_leads' WHERE application_id = $1`,
                [applicationId]
              );
              
              await pool.query(
                `UPDATE pos_application SET status = 'approved_leads' WHERE application_id = $1`,
                [applicationId]
              );
            }
          }
        }

        return NextResponse.json({ success: true, message: 'Offer submitted or lead purchased.' });
    } catch (err) {
        console.error('Failed to mark lead as purchased:', err);
        return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
    }
}

export async function GET(req, { params }) {
    const businessUserId = params.id;

    try {
        const result = await pool.query(
          `SELECT
            u.entity_name,
            ao.offer_device_setup_fee,
            ao.offer_transaction_fee_mada,
            ao.offer_transaction_fee_visa_mc,
            ao.offer_settlement_time_mada,
            ao.offer_comment,
            ao.submitted_at AS submitted_at
          FROM application_offers ao
          JOIN submitted_applications sa ON ao.submitted_application_id = sa.id
          JOIN pos_application pa ON sa.application_id = pa.application_id
          JOIN users u ON u.user_id = sa.purchased_by[1]
          WHERE pa.user_id = $1`,
          [businessUserId]
        );

        return NextResponse.json({ success: true, approved: result.rows });
    } catch (err) {
        console.error('Failed to fetch approved reactions:', err);
        return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
    }
}