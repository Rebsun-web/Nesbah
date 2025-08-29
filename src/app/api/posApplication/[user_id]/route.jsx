import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateAPIRequest } from '@/lib/auth/api-auth';

export async function GET(req, { params }) {
    console.log('🔍 API: POS application request received');
    
    // Get user from cookies (middleware already validated)
    const userToken = req.cookies.get('user_token')?.value;
    if (!userToken) {
        console.log('🔍 API: No user token found');
        return NextResponse.json(
            { success: false, error: 'No authentication token' },
            { status: 401 }
        );
    }
    
    try {
        // Import JWT utility for verification
        const JWTUtils = (await import('@/lib/auth/jwt-utils.js')).default;
        
        // Verify JWT token
        const verificationResult = JWTUtils.verifyToken(userToken);
        
        if (!verificationResult.valid) {
            console.log('🔍 API: Invalid token');
            return NextResponse.json(
                { success: false, error: 'Invalid token' },
                { status: 401 }
            );
        }
        
        const user = verificationResult.payload;
        console.log('🔍 API: Authenticated user:', user);
        
        const { user_id } = await params;

        // Ensure user can only access their own applications
        if (user.user_id !== parseInt(user_id)) {
            console.log('🔍 API: Access denied - user ID mismatch');
            return NextResponse.json(
                { success: false, error: 'Access denied' },
                { status: 403 }
            );
        }

        const client = await pool.connectWithRetry();
    
    try {
        const result = await client.query(
            'SELECT * FROM pos_application WHERE user_id = $1 ORDER BY submitted_at DESC',
            [user_id]
        );

        const applications = result.rows.map(app => ({
            ...app,
            uploaded_document: app.uploaded_document
                ? `data:application/octet-stream;base64,${app.uploaded_document.toString('base64')}`
                : null,
        }));

        return NextResponse.json({ success: true, data: applications });
    } catch (error) {
        console.error('Error fetching POS applications:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch applications' }, { status: 500 });
    } finally {
        client.release();
    }
    } catch (error) {
        console.error('🔍 API: JWT verification error:', error);
        return NextResponse.json(
            { success: false, error: 'Authentication error' },
            { status: 401 }
        );
    }
}
