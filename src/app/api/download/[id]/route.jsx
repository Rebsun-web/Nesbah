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

        return new NextResponse(uploaded_document, {
            status: 200,
            headers: {
                'Content-Type': uploaded_mimetype || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${uploaded_filename || `application_${id}_file`}"`,
            },
        });
    } catch (err) {
        console.error('Download error:', err);
        return new NextResponse('Internal server error', { status: 500 });
    }
}