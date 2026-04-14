import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateAPIRequest } from '@/lib/auth/api-auth';

export async function GET(req, { params }) {
    const { id } = params;

    const authResult = await authenticateAPIRequest(req);
    if (!authResult.success) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const result = await pool.query(
            'SELECT uploaded_document, uploaded_filename, uploaded_mimetype, user_id, opened_by, purchased_by FROM pos_application WHERE application_id = $1',
            [id]
        );

        if (result.rows.length === 0 || !result.rows[0].uploaded_document) {
            return new NextResponse('File not found', { status: 404 });
        }

        const { uploaded_document, uploaded_filename, uploaded_mimetype, user_id, opened_by, purchased_by } = result.rows[0];

        // Ownership check — admin sees all; bank must have opened/purchased; business must own it
        const userType = authResult.user.user_type;
        if (userType !== 'admin_user') {
            const requestingUserId = parseInt(authResult.user.user_id);
            const openedBy = opened_by || [];
            const purchasedBy = purchased_by || [];

            const isBankWithAccess = (userType === 'bank_user' || userType === 'bank_employee') &&
                (openedBy.includes(requestingUserId) || purchasedBy.includes(requestingUserId));
            const isOwner = userType === 'business_user' && user_id === requestingUserId;

            if (!isBankWithAccess && !isOwner) {
                return new NextResponse('Forbidden', { status: 403 });
            }
        }

        // Convert base64 string back to buffer
        let fileBuffer;
        try {
            if (typeof uploaded_document === 'string') {
                fileBuffer = Buffer.from(uploaded_document, 'base64');
            } else if (Buffer.isBuffer(uploaded_document)) {
                fileBuffer = uploaded_document;
            } else {
                throw new Error('Invalid document format');
            }
        } catch (bufferError) {
            console.error('Buffer conversion error:', bufferError);
            return new NextResponse('Invalid file format', { status: 400 });
        }

        const filename = uploaded_filename || `application_${id}_document`;
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
