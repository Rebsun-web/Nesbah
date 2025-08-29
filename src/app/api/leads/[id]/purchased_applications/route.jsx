import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { AnalyticsService } from '@/lib/analytics/analytics-service';

export async function POST(req, { params }) {
    const applicationId = (await params).id;
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

        // Check if already purchased using pos_application table
        const check = await pool.query(
            `SELECT * FROM pos_application
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

            // Update pos_application with purchase tracking
            await pool.query(
                `UPDATE pos_application
                 SET
                     purchased_by = array_append(purchased_by, $1),
                     revenue_collected = revenue_collected + $2,
                     offers_count = offers_count + 1
                 WHERE application_id = $3`,
                [bankUserId, 25.00, applicationId]
            );

            // Keep pos_application status as 'live_auction' - don't change to 'completed'
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

          // Check if purchased using pos_application table
          const result = await pool.query(
            `SELECT application_id FROM pos_application WHERE application_id = $1 AND $2 = ANY(purchased_by)`,
            [applicationId, bankUserId]
          );

          if (result.rowCount > 0) {
            const submittedApplicationId = applicationId; // Use application_id directly

            const offerResult = await pool.query(
              `INSERT INTO application_offers (
                submitted_application_id,
                bank_user_id,
                submitted_by_user_id,
                offer_device_setup_fee,
                offer_transaction_fee_mada,
                offer_transaction_fee_visa_mc,
                offer_settlement_time_mada,
                offer_comment,
                uploaded_document,
                uploaded_mimetype,
                uploaded_filename,
                status,
                offer_selection_deadline
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
              RETURNING offer_id`,
              [
                submittedApplicationId,
                bankUserId, // Set bank_user_id
                bankUserId, // Set submitted_by_user_id to same value
                offer_device_setup_fee || null,
                offer_transaction_fee_mada || null,
                offer_transaction_fee_visa_mc || null,
                offer_settlement_time_mada || null,
                offer_comment || null,
                uploadedDocument,
                uploadedMimetype,
                uploadedFilename,
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

            // Update offers count in pos_application
            await pool.query(
              `UPDATE pos_application
               SET offers_count = offers_count + 1
               WHERE application_id = $1`,
              [applicationId]
            );

            // Note: Application status remains 'live_auction' until auction period ends
            // Status will be updated to 'completed' or 'ignored' after 48-hour auction period
            console.log(`📝 Offer recorded for application #${applicationId} - status remains live_auction until auction ends`);
          }
        }

        return NextResponse.json({ success: true, message: 'Offer submitted or lead purchased.' });
    } catch (err) {
        console.error('Failed to mark lead as purchased:', err);
        return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
    }
}

export async function GET(req, { params }) {
    const businessUserId = (await params).id;

    try {
        // Query using pos_application table with current structure
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
          JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
          JOIN users u ON u.user_id = ao.submitted_by_user_id
          WHERE pa.user_id = $1`,
          [businessUserId]
        );

        return NextResponse.json({ success: true, approved: result.rows });
    } catch (err) {
        console.error('Failed to fetch approved reactions:', err);
        return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
    }
}