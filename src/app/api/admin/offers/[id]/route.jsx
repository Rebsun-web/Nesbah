import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import AdminAuth from '@/lib/auth/admin-auth'

export async function PUT(request, { params }) {
    const client = await pool.connect()
    
    try {
        // Verify admin authentication
        const adminToken = request.cookies.get('admin_token')?.value
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const adminUser = await AdminAuth.verifyToken(adminToken)
        if (!adminUser) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
        }

        const offerId = params.id
        const { 
            device_setup_fee, 
            mada_transaction_fee, 
            visa_mc_transaction_fee, 
            mada_settlement_time, 
            offer_comment, 
            admin_notes 
        } = await request.json()

        // Check if offer exists
        const offerCheck = await client.query(`
            SELECT offer_id FROM application_offers WHERE offer_id = $1
        `, [offerId])

        if (offerCheck.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 })
        }

        // Update the offer
        const updateQuery = await client.query(`
            UPDATE application_offers SET
                offer_device_setup_fee = $1,
                offer_transaction_fee_mada = $2,
                offer_transaction_fee_visa_mc = $3,
                offer_settlement_time_mada = $4,
                offer_comment = $5,
                admin_notes = $6,
                updated_at = NOW()
            WHERE offer_id = $7
            RETURNING offer_id
        `, [
            parseFloat(device_setup_fee) || 0,
            parseFloat(mada_transaction_fee) || 0,
            parseFloat(visa_mc_transaction_fee) || 0,
            parseInt(mada_settlement_time) || 24,
            offer_comment || '',
            admin_notes || '',
            offerId
        ])

        return NextResponse.json({
            success: true,
            message: 'Offer updated successfully',
            offer_id: updateQuery.rows[0].offer_id
        })

    } catch (error) {
        console.error('Error updating offer:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    } finally {
        client.release()
    }
}

export async function DELETE(request, { params }) {
    const client = await pool.connect()
    
    try {
        // Verify admin authentication
        const adminToken = request.cookies.get('admin_token')?.value
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const adminUser = await AdminAuth.verifyToken(adminToken)
        if (!adminUser) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
        }

        const offerId = params.id

        // Check if offer exists
        const offerCheck = await client.query(`
            SELECT offer_id, status FROM application_offers WHERE offer_id = $1
        `, [offerId])

        if (offerCheck.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 })
        }

        // Check if offer can be deleted (not won)
        const offer = offerCheck.rows[0]
        if (offer.status === 'deal_won') {
            return NextResponse.json({ 
                success: false, 
                error: 'Cannot delete won offers' 
            }, { status: 400 })
        }

        // Delete the offer
        await client.query(`
            DELETE FROM application_offers WHERE offer_id = $1
        `, [offerId])

        return NextResponse.json({
            success: true,
            message: 'Offer deleted successfully'
        })

    } catch (error) {
        console.error('Error deleting offer:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    } finally {
        client.release()
    }
}
