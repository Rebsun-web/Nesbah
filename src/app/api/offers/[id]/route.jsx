import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export async function GET(request, { params }) {
    const { id } = await params

    if (!id) {
        return NextResponse.json(
            { success: false, error: 'Offer ID is required' },
            { status: 400 }
        )
    }

    const client = await pool.connectWithRetry(2, 1000, 'app_api_offers_[id]_route.jsx_route')

    try {
        // Get offer details with all related information
        const query = `
            SELECT 
                ao.offer_id,
                ao.submitted_application_id,
                ao.bank_user_id,
                ao.offer_device_setup_fee,
                ao.offer_transaction_fee_mada,
                ao.offer_transaction_fee_visa_mc,
                ao.offer_settlement_time_mada,
                ao.offer_settlement_time_visa_mc,
                ao.offer_comment,
                ao.offer_terms,
                ao.offer_validity_days,
                ao.status,
                ao.submitted_at,
                ao.accepted_at,
                ao.expires_at,
                ao.bank_name,
                ao.bank_contact_person,
                ao.bank_contact_email,
                ao.bank_contact_phone,
                ao.includes_hardware,
                ao.includes_software,
                ao.includes_support,
                ao.support_hours,
                ao.warranty_months,
                ao.pricing_tier,
                ao.volume_discount_threshold,
                ao.volume_discount_percentage,

                ao.settlement_time,
                ao.deal_value,
                ao.commission_rate,
                ao.commission_amount,
                ao.bank_revenue,
                ao.admin_notes,
                ao.is_featured,
                ao.featured_reason,
                ao.uploaded_document,
                ao.uploaded_mimetype,
                ao.uploaded_filename,
                pa.trade_name as business_name,
                pa.city as business_city,
                pa.contact_person as business_contact,
                pa.contact_person_number as business_phone,
                pa.application_id,
                u.entity_name as bank_entity_name,
                u.email as bank_email,
                bu.logo_url as bank_logo,
                COALESCE(pa.current_application_status, pa.status) as application_status
            FROM application_offers ao
            LEFT JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
            LEFT JOIN users u ON ao.bank_user_id = u.user_id
            LEFT JOIN bank_users bu ON ao.bank_user_id = bu.user_id
            WHERE ao.offer_id = $1
        `

        const result = await client.query(query, [id])

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Offer not found' },
                { status: 404 }
            )
        }

        const offer = result.rows[0]

        // Format the offer data
        const formattedOffer = {
            offer_id: offer.offer_id,
            submitted_application_id: offer.submitted_application_id,
            bank_user_id: offer.bank_user_id,
            offer_device_setup_fee: offer.offer_device_setup_fee,
            offer_transaction_fee_mada: offer.offer_transaction_fee_mada,
            offer_transaction_fee_visa_mc: offer.offer_transaction_fee_visa_mc,
            offer_settlement_time_mada: offer.offer_settlement_time_mada,
            offer_settlement_time_visa_mc: offer.offer_settlement_time_visa_mc,
            offer_comment: offer.offer_comment,
            offer_terms: offer.offer_terms,
            offer_validity_days: offer.offer_validity_days,
            status: offer.status,
            submitted_at: offer.submitted_at,
            accepted_at: offer.accepted_at,
            expires_at: offer.expires_at,
            bank_name: offer.bank_name || offer.bank_entity_name,
            bank_contact_person: offer.bank_contact_person,
            bank_contact_email: offer.bank_contact_email,
            bank_contact_phone: offer.bank_contact_phone,
            includes_hardware: offer.includes_hardware,
            includes_software: offer.includes_software,
            includes_support: offer.includes_support,
            support_hours: offer.support_hours,
            warranty_months: offer.warranty_months,
            pricing_tier: offer.pricing_tier,
            volume_discount_threshold: offer.volume_discount_threshold,
            volume_discount_percentage: offer.volume_discount_percentage,

            settlement_time: offer.settlement_time,
            deal_value: offer.deal_value,
            commission_rate: offer.commission_rate,
            commission_amount: offer.commission_amount,
            bank_revenue: offer.bank_revenue,
            admin_notes: offer.admin_notes,
            is_featured: offer.is_featured,
            featured_reason: offer.featured_reason,
            uploaded_filename: offer.uploaded_filename,
            uploaded_mimetype: offer.uploaded_mimetype,
            business_name: offer.business_name,
            business_city: offer.business_city,
            business_contact: offer.business_contact,
            business_phone: offer.business_phone,
            application_id: offer.application_id,
            bank_logo: offer.bank_logo,
            application_status: offer.application_status
        }

        return NextResponse.json({
            success: true,
            offer: formattedOffer
        })

    } catch (error) {
        console.error('Error fetching offer details:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch offer details' },
            { status: 500 }
        )
    } finally {
        client.release()
    }
}
