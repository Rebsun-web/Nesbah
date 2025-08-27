import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(_, { params }) {
    const { id } = params;

    try {
        const result = await pool.query(
            'SELECT uploaded_document, uploaded_filename, uploaded_mimetype FROM pos_application WHERE application_id = $1',
            [id]
        );

        if (result.rows.length === 0 || !result.rows[0].uploaded_document) {
            return new NextResponse('File not found', { status: 404 });
        }

        const { uploaded_document, uploaded_filename, uploaded_mimetype } = result.rows[0];

        // Convert base64 string back to buffer
        let fileBuffer;
        try {
            if (typeof uploaded_document === 'string') {
                // Handle base64 string
                fileBuffer = Buffer.from(uploaded_document, 'base64');
            } else if (Buffer.isBuffer(uploaded_document)) {
                // Handle buffer directly
                fileBuffer = uploaded_document;
            } else {
                throw new Error('Invalid document format');
            }
        } catch (bufferError) {
            console.error('Buffer conversion error:', bufferError);
            return new NextResponse('Invalid file format', { status: 400 });
        }

        // Set proper filename with fallback
        const filename = uploaded_filename || `application_${id}_document`;
        
        // Set proper MIME type with fallback
        const mimeType = uploaded_mimetype || 'application/octet-stream';

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
        });
    } catch (err) {
        console.error('Download error:', err);
        return new NextResponse('Internal server error', { status: 500 });
    }
}