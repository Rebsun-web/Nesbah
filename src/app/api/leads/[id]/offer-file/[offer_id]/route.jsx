import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req, { params }) {
    const { id: applicationId, offer_id: offerId } = params

    try {
        // Get the offer file from application_offers table
        const { rows } = await pool.query(
            `SELECT uploaded_document, uploaded_mimetype, uploaded_filename
            FROM application_offers
            WHERE offer_id = $1 AND submitted_application_id = $2`,
            [offerId, applicationId]
        )

        if (rows.length === 0) {
            return new NextResponse('Offer file not found', { status: 404 })
        }

        const file = rows[0]

        if (!file.uploaded_document) {
            return new NextResponse('No file uploaded for this offer', { status: 404 })
        }

        return new NextResponse(Buffer.from(file.uploaded_document, 'base64'), {
            status: 200,
            headers: {
                'Content-Type': file.uploaded_mimetype || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${file.uploaded_filename || 'offer_document.pdf'}"`,
            },
        })
    } catch (err) {
        console.error('Error serving offer document:', err)
        return new NextResponse('Internal server error', { status: 500 })
    }
}
