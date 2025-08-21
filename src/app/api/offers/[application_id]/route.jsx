import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Fetch all offers for a business user's application
export async function GET(req, { params }) {
    const { application_id } = params;
    
    try {
        const result = await pool.query(
            `SELECT 
                ao.id as offer_id,
                ao.offer_device_setup_fee,
                ao.offer_transaction_fee_mada,
                ao.offer_transaction_fee_visa_mc,
                ao.offer_settlement_time_mada,
                ao.offer_comment,
                ao.submitted_at,
                ao.status as offer_status,
                ao.offer_selection_deadline,
                u.entity_name as bank_name,
                u.user_id as bank_user_id,
                sa.status as application_status,
                sa.offer_selection_end_time
             FROM application_offers ao
             JOIN submitted_applications sa ON ao.submitted_application_id = sa.id
             JOIN pos_application pa ON sa.application_id = pa.application_id
             JOIN users u ON ao.submitted_by_user_id = u.user_id
             WHERE pa.application_id = $1
             ORDER BY ao.submitted_at DESC`,
            [application_id]
        );

        return NextResponse.json({ 
            success: true, 
            data: result.rows,
            application_status: result.rows[0]?.application_status || 'pending_offers'
        });
    } catch (err) {
        console.error('Failed to fetch offers:', err);
        return NextResponse.json({ success: false, error: 'Failed to fetch offers' }, { status: 500 });
    }
}

// POST: Business user selects an offer
export async function POST(req, { params }) {
    const { application_id } = params;
    const { selected_offer_id, business_user_id } = await req.json();

    if (!selected_offer_id || !business_user_id) {
        return NextResponse.json({ success: false, error: 'Missing offer ID or business user ID' }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Verify the application belongs to the business user
        const appCheck = await client.query(
            `SELECT pa.application_id, sa.status 
             FROM pos_application pa
             JOIN submitted_applications sa ON pa.application_id = sa.application_id
             WHERE pa.application_id = $1 AND pa.user_id = $2`,
            [application_id, business_user_id]
        );

        if (appCheck.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ success: false, error: 'Application not found or unauthorized' }, { status: 404 });
        }

        const applicationStatus = appCheck.rows[0].status;
        
        if (applicationStatus !== 'offer_received') {
            await client.query('ROLLBACK');
            return NextResponse.json({ success: false, error: 'Application is not in offer selection phase' }, { status: 400 });
        }

        // Verify the offer exists and belongs to this application
        const offerCheck = await client.query(
            `SELECT ao.id, ao.submitted_application_id, ao.status
             FROM application_offers ao
             JOIN submitted_applications sa ON ao.submitted_application_id = sa.id
             WHERE ao.id = $1 AND sa.application_id = $2`,
            [selected_offer_id, application_id]
        );

        if (offerCheck.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 });
        }

        const offerStatus = offerCheck.rows[0].status;
        if (offerStatus !== 'submitted') {
            await client.query('ROLLBACK');
            return NextResponse.json({ success: false, error: 'Offer is not available for selection' }, { status: 400 });
        }

        // Check if offer selection deadline has passed
        const deadlineCheck = await client.query(
            `SELECT offer_selection_deadline FROM application_offers WHERE id = $1`,
            [selected_offer_id]
        );

        if (deadlineCheck.rowCount > 0) {
            const deadline = new Date(deadlineCheck.rows[0].offer_selection_deadline);
            if (new Date() > deadline) {
                await client.query('ROLLBACK');
                return NextResponse.json({ success: false, error: 'Offer selection deadline has passed' }, { status: 400 });
            }
        }

        // Record the offer selection
        await client.query(
            `INSERT INTO offer_selections (application_id, selected_offer_id, business_user_id)
             VALUES ($1, $2, $3)`,
            [application_id, selected_offer_id, business_user_id]
        );

        // Update the selected offer status to 'deal_won'
        await client.query(
            `UPDATE application_offers SET status = 'deal_won' WHERE id = $1`,
            [selected_offer_id]
        );

        // Update all other offers for this application to 'deal_lost'
        await client.query(
            `UPDATE application_offers 
             SET status = 'deal_lost' 
             WHERE submitted_application_id = $1 AND id != $2`,
            [offerCheck.rows[0].submitted_application_id, selected_offer_id]
        );

        // Update application status to 'completed'
        await client.query(
            `UPDATE submitted_applications SET status = 'completed' WHERE application_id = $1`,
            [application_id]
        );

        await client.query(
            `UPDATE pos_application SET status = 'completed' WHERE application_id = $1`,
            [application_id]
        );

        await client.query('COMMIT');

        return NextResponse.json({ 
            success: true, 
            message: 'Offer selected successfully',
            selected_offer_id: selected_offer_id
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Failed to select offer:', err);
        return NextResponse.json({ success: false, error: 'Failed to select offer' }, { status: 500 });
    } finally {
        client.release();
    }
}
