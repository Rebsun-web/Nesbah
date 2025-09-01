import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req, { params }) {
    const { id: applicationId } = params

    try {
        // Get the most recent offer file for this application
        const { rows } = await pool.query(
            `SELECT uploaded_document, uploaded_mimetype, uploaded_filename
            FROM application_offers
            WHERE submitted_application_id = $1 
            AND uploaded_document IS NOT NULL
            ORDER BY submitted_at DESC
            LIMIT 1`,
            [applicationId]
        )

        if (rows.length === 0) {
            return new NextResponse('No offer files found for this application', { status: 404 })
        }

        const file = rows[0]

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
