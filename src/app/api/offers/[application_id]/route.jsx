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
        return NextResponse.json({ 
            success: false, 
            error: 'Missing required fields: selected_offer_id and business_user_id' 
        }, { status: 400 });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Verify the business user owns this application
        const ownershipCheck = await client.query(
            `SELECT pa.application_id 
             FROM pos_application pa
             WHERE pa.application_id = $1 AND pa.user_id = $2`,
            [application_id, business_user_id]
        );
        
        if (ownershipCheck.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ 
                success: false, 
                error: 'Application not found or access denied' 
            }, { status: 404 });
        }
        
        // Verify the offer exists and belongs to this application
        const offerCheck = await client.query(
            `SELECT ao.offer_id, ao.submitted_by_user_id
             FROM application_offers ao
             JOIN submitted_applications sa ON ao.submitted_application_id = sa.id
             WHERE sa.application_id = $1 AND ao.offer_id = $2`,
            [application_id, selected_offer_id]
        );
        
        if (offerCheck.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ 
                success: false, 
                error: 'Offer not found for this application' 
            }, { status: 404 });
        }
        
        // Check if an offer has already been selected for this application
        const existingSelection = await client.query(
            `SELECT id FROM offer_selections WHERE application_id = $1`,
            [application_id]
        );
        
        if (existingSelection.rowCount > 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ 
                success: false, 
                error: 'An offer has already been selected for this application' 
            }, { status: 409 });
        }
        
        // Insert the offer selection
        // The trigger will automatically update the tracking table
        await client.query(
            `INSERT INTO offer_selections (application_id, selected_offer_id, business_user_id)
             VALUES ($1, $2, $3)`,
            [application_id, selected_offer_id, business_user_id]
        );
        
        // Update application status to completed
        await client.query(
            `UPDATE submitted_applications 
             SET status = 'completed' 
             WHERE application_id = $1`,
            [application_id]
        );
        
        await client.query(
            `UPDATE pos_application 
             SET status = 'completed' 
             WHERE application_id = $1`,
            [application_id]
        );
        
        await client.query('COMMIT');
        
        return NextResponse.json({ 
            success: true, 
            message: 'Offer selected successfully' 
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Failed to select offer:', err);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to select offer' 
        }, { status: 500 });
    } finally {
        client.release();
    }
}
