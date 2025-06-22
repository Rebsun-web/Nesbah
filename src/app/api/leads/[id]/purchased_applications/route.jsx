import { NextResponse } from 'next/server';
import pool from '@/lib/db';

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
            await pool.query(
                `UPDATE submitted_applications
                 SET
                     purchased_by = array_append(purchased_by, $1),
                     purchased_by_timestamps = jsonb_set(
                             COALESCE(purchased_by_timestamps, '{}'),
                             $2,
                             to_jsonb(to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
                         )
                 WHERE application_id = $3`,
                [bankUserId, `{${bankUserId}}`, applicationId]
            );

            await pool.query(
                `UPDATE pos_application
                 SET status = 'accepted'
                 WHERE application_id = $1`,
                [applicationId]
            );
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

            await pool.query(
              `INSERT INTO application_offers (
                submitted_application_id,
                offer_device_setup_fee,
                offer_transaction_fee_mada,
                offer_transaction_fee_visa_mc,
                offer_settlement_time_mada,
                offer_comment,
                uploaded_document,
                uploaded_mimetype,
                uploaded_filename
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                submittedApplicationId,
                offer_device_setup_fee || null,
                offer_transaction_fee_mada || null,
                offer_transaction_fee_visa_mc || null,
                offer_settlement_time_mada || null,
                offer_comment || null,
                uploadedDocument,
                uploadedMimetype,
                uploadedFilename
              ]
            );
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