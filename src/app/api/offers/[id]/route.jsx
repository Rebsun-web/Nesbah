import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { authenticateAPIRequest } from '@/lib/auth/api-auth'

export async function GET(request, { params }) {
    const { id } = await params

    if (!id) {
        return NextResponse.json(
            { success: false, error: 'Offer ID is required' },
            { status: 400 }
        )
    }

    const authResult = await authenticateAPIRequest(request)
    if (!authResult.success) {
        return NextResponse.json(
            { success: false, error: authResult.error },
            { status: authResult.status || 401 }
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
                ao.offer_comment,
                ao.offer_terms,
                ao.offer_validity_days,
                ao.status,
                ao.submitted_at,
                ao.expires_at,
                ao.bank_name,
                ao.bank_contact_person,
                ao.bank_contact_email,
                ao.bank_contact_phone,

                ao.admin_notes,
                ao.is_featured,
                ao.featured_reason,
                ao.uploaded_document,
                ao.uploaded_mimetype,
                ao.uploaded_filename,
                wd.trade_name as business_name,
                wd.city as business_city,
                pa.contact_person as business_contact,
                pa.contact_person_number as business_phone,
                pa.application_id,
                u.entity_name as bank_entity_name,
                u.email as bank_email,
                bu.logo_url as bank_logo,
                COALESCE(pa.current_application_status, pa.status) as application_status
            FROM application_offers ao
            LEFT JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
            LEFT JOIN wathiq_data wd ON wd.cr_national_number = pa.cr_national_number
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

        // Ownership check: bank_user can only see their own offers; admin sees all
        const userType = authResult.user.user_type
        if (userType !== 'admin_user') {
            const requestingUserId = parseInt(authResult.user.user_id)
            if (offer.bank_user_id !== requestingUserId) {
                return NextResponse.json(
                    { success: false, error: 'Forbidden' },
                    { status: 403 }
                )
            }
        }

        // Format the offer data
        const formattedOffer = {
            offer_id: offer.offer_id,
            submitted_application_id: offer.submitted_application_id,
            bank_user_id: offer.bank_user_id,
            offer_comment: offer.offer_comment,
            offer_terms: offer.offer_terms,
            offer_validity_days: offer.offer_validity_days,
            status: offer.status,
            submitted_at: offer.submitted_at,
            expires_at: offer.expires_at,
            bank_name: offer.bank_name || offer.bank_entity_name,
            bank_contact_person: offer.bank_contact_person,
            bank_contact_email: offer.bank_contact_email,
            bank_contact_phone: offer.bank_contact_phone,

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
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    } finally {
        client.release()
    }
}
