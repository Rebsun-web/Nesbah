import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateAPIRequest } from '@/lib/auth/api-auth';
import fs from 'fs';
import path from 'path';

export async function GET(req, { params }) {
    try {
        // Authenticate the request
        const authResult = await authenticateAPIRequest(req, 'bank_user');
        if (!authResult.success) {
            return NextResponse.json(
                { success: false, error: authResult.error },
                { status: authResult.status || 401 }
            );
        }

        const { id } = params;
        
        // Get the file information from the database
        const result = await pool.query(
            'SELECT uploaded_filename, submitted_by_user_id FROM application_offers WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Offer not found' },
                { status: 404 }
            );
        }

        const { uploaded_filename, submitted_by_user_id } = result.rows[0];

        if (!uploaded_filename) {
            return NextResponse.json(
                { success: false, error: 'No file uploaded for this offer' },
                { status: 404 }
            );
        }

        // Construct the file path
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'offers');
        const filePath = path.join(uploadsDir, uploaded_filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return NextResponse.json(
                { success: false, error: 'File not found on server' },
                { status: 404 }
            );
        }

        // Read the file
        const fileBuffer = fs.readFileSync(filePath);
        
        // Get file extension for content type
        const ext = path.extname(uploaded_filename).toLowerCase();
        let contentType = 'application/octet-stream';
        
        switch (ext) {
            case '.pdf':
                contentType = 'application/pdf';
                break;
            case '.jpg':
            case '.jpeg':
                contentType = 'image/jpeg';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.doc':
                contentType = 'application/msword';
                break;
            case '.docx':
                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                break;
            case '.xls':
                contentType = 'application/vnd.ms-excel';
                break;
            case '.xlsx':
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                break;
        }

        // Return the file with appropriate headers
        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${uploaded_filename}"`,
                'Content-Length': fileBuffer.length.toString(),
            },
        });

    } catch (error) {
        console.error('Error downloading offer file:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to download offer file' },
            { status: 500 }
        );
    }
}
