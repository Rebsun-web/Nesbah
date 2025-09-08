import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req, { params }) {
    try {
        const { id } = params
        
        // Get the offer document from the database
        const result = await pool.query(
            `SELECT uploaded_document, uploaded_mimetype, uploaded_filename
            FROM application_offers
            WHERE offer_id = $1`,
            [id]
        )

        if (result.rows.length === 0) {
            return new NextResponse('Offer not found', { status: 404 })
        }

        const offer = result.rows[0]

        if (!offer.uploaded_document) {
            return new NextResponse('No document uploaded for this offer', { status: 404 })
        }

        // Convert base64 string back to buffer
        let fileBuffer
        try {
            if (typeof offer.uploaded_document === 'string') {
                // Handle base64 string
                fileBuffer = Buffer.from(offer.uploaded_document, 'base64')
            } else if (Buffer.isBuffer(offer.uploaded_document)) {
                // Handle buffer directly
                fileBuffer = offer.uploaded_document
            } else {
                throw new Error('Invalid document format')
            }
        } catch (bufferError) {
            console.error('Buffer conversion error:', bufferError)
            return new NextResponse('Invalid file format', { status: 400 })
        }

        // Set proper filename with fallback
        const filename = offer.uploaded_filename || `offer_${id}_document`
        
        // Set proper MIME type with fallback
        const mimeType = offer.uploaded_mimetype || 'application/octet-stream'

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': fileBuffer.length.toString(),
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
        })
    } catch (err) {
        console.error('Error serving offer document:', err)
        return new NextResponse('Internal server error', { status: 500 })
    }
}
