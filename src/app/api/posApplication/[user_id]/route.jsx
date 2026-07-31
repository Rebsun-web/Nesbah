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
        const userIdInt = parseInt(user_id);

        console.log('🔍 API: User ID from params:', user_id, 'Parsed:', userIdInt);
        console.log('🔍 API: Authenticated user ID:', user.user_id);

        // Ensure user can only access their own applications
        if (user.user_id !== userIdInt) {
            console.log('🔍 API: Access denied - user ID mismatch');
            return NextResponse.json(
                { success: false, error: 'Access denied' },
                { status: 403 }
            );
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_posApplication_[user_id]_route.jsx_route');
    
        try {
            // APPLICANT-FACING endpoint: explicit column list, never SELECT *.
            // `lead_score` / `lead_tier` are deliberately excluded — the internal
            // prioritization indicator is for admins and financing partners only and
            // must not reach the applicant, not even in an unrendered JSON field.
            const result = await client.query(
                `SELECT
                    application_id,
                    user_id,
                    status,
                    current_application_status,
                    submitted_at,
                    updated_at,
                    reference_number,
                    notes,
                    admin_notes,
                    financing_type,
                    approximate_financing_amount,
                    amount_range_code,
                    requested_financing_amount,
                    preferred_repayment_period_months,
                    business_age_range_code,
                    annual_revenue_code,
                    is_pre_revenue,
                    own_pos_system,
                    number_of_pos_devices,
                    city_of_operation,
                    city_code,
                    sector,
                    sector_code,
                    cr_national_number,
                    contact_person,
                    contact_person_number,
                    business_contact_email,
                    verification_status,
                    auction_end_time,
                    offer_selection_end_time,
                    offers_count,
                    opened_by,
                    purchased_by,
                    uploaded_document,
                    uploaded_filename,
                    uploaded_mimetype,
                    consent_at,
                    consent_version
                 FROM pos_application
                 WHERE user_id = $1 AND status IN ($2, $3)
                 ORDER BY submitted_at DESC`,
                [userIdInt, 'live_auction', 'completed']
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
