import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req, { params }) {
    const { id } = params

    try {
        const { rows } = await pool.query(
            `SELECT uploaded_document, uploaded_mimetype, uploaded_filename
       FROM pos_application
       WHERE application_id = $1`,
            [id]
        )

        if (rows.length === 0) {
            return new NextResponse('File not found', { status: 404 })
        }

        const file = rows[0]

        return new NextResponse(Buffer.from(file.uploaded_document, 'base64'), {
            status: 200,
            headers: {
                'Content-Type': file.uploaded_mimetype || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${file.uploaded_filename || 'document.pdf'}"`,
            },
        })
    } catch (err) {
        console.error('Error serving document:', err)
        return new NextResponse('Internal server error', { status: 500 })
    }
}