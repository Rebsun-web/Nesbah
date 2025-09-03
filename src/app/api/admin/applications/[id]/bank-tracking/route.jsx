import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

// GET - Get bank tracking information for an application
export async function GET(req, { params }) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session using session manager
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        const { id } = await params;
        const applicationId = parseInt(id);

        if (isNaN(applicationId)) {
            return NextResponse.json({ success: false, error: 'Invalid application ID' }, { status: 400 });
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_applications_[id]_bank-tracking_route.jsx_route');
        
        try {
            // Get bank tracking information with bank details
            const query = `
                SELECT 
                    pa.application_id,
                    pa.trade_name,
                    pa.opened_by,
                    pa.purchased_by,
                    array_length(pa.opened_by, 1) as opened_count,
                    array_length(pa.purchased_by, 1) as purchased_count,
                    -- Get opened banks details
                    COALESCE(
                        json_agg(
                            DISTINCT jsonb_build_object(
                                'bank_user_id', bu_opened.user_id,
                                'bank_name', bu_opened.entity_name,
                                'logo_url', bu_opened.logo_url,
                                'email', u_opened.email
                            )
                        ) FILTER (WHERE bu_opened.user_id IS NOT NULL), 
                        '[]'::json
                    ) as opened_banks_details,
                    -- Get purchased banks details
                    COALESCE(
                        json_agg(
                            DISTINCT jsonb_build_object(
                                'bank_user_id', bu_purchased.user_id,
                                'bank_name', bu_purchased.entity_name,
                                'logo_url', bu_purchased.logo_url,
                                'email', u_purchased.email
                            )
                        ) FILTER (WHERE bu_purchased.user_id IS NOT NULL), 
                        '[]'::json
                    ) as purchased_banks_details
                FROM pos_application pa
                LEFT JOIN LATERAL unnest(pa.opened_by) AS opened_bank_id ON true
                LEFT JOIN bank_users bu_opened ON opened_bank_id = bu_opened.user_id
                LEFT JOIN users u_opened ON bu_opened.user_id = u_opened.user_id
                LEFT JOIN LATERAL unnest(pa.purchased_by) AS purchased_bank_id ON true
                LEFT JOIN bank_users bu_purchased ON purchased_bank_id = bu_purchased.user_id
                LEFT JOIN users u_purchased ON bu_purchased.user_id = u_purchased.user_id
                WHERE pa.application_id = $1
                GROUP BY pa.application_id, pa.trade_name, pa.opened_by, pa.purchased_by
            `;
            
            const result = await client.query(query, [applicationId]);
            
            if (result.rows.length === 0) {
                return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
            }

            const trackingInfo = result.rows[0];
            
            return NextResponse.json({
                success: true,
                data: {
                    application_id: trackingInfo.application_id,
                    trade_name: trackingInfo.trade_name,
                    opened_by: trackingInfo.opened_by || [],
                    purchased_by: trackingInfo.purchased_by || [],
                    opened_count: trackingInfo.opened_count || 0,
                    purchased_count: trackingInfo.purchased_count || 0,
                    opened_banks_details: trackingInfo.opened_banks_details || [],
                    purchased_banks_details: trackingInfo.purchased_banks_details || []
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Bank tracking info error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch bank tracking information' },
            { status: 500 }
        );
    }
}

// POST - Add bank to opened_by (when bank views application)
export async function POST(req, { params }) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session using session manager
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        const { id } = await params;
        const applicationId = parseInt(id);

        if (isNaN(applicationId)) {
            return NextResponse.json({ success: false, error: 'Invalid application ID' }, { status: 400 });
        }

        const body = await req.json();
        const { bank_user_id, action } = body;

        if (!bank_user_id || !action) {
            return NextResponse.json({ success: false, error: 'Bank user ID and action are required' }, { status: 400 });
        }

        if (!['view', 'purchase'].includes(action)) {
            return NextResponse.json({ success: false, error: 'Action must be either "view" or "purchase"' }, { status: 400 });
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_applications_[id]_bank-tracking_route.jsx_route');
        
        try {
            // Verify application exists
            const appCheck = await client.query(
                'SELECT application_id FROM pos_application WHERE application_id = $1',
                [applicationId]
            );
            
            if (appCheck.rows.length === 0) {
                return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
            }

            // Verify bank user exists
            const bankCheck = await client.query(
                'SELECT user_id FROM bank_users WHERE user_id = $1',
                [bank_user_id]
            );
            
            if (bankCheck.rows.length === 0) {
                return NextResponse.json({ success: false, error: 'Bank user not found' }, { status: 404 });
            }

            let result;
            
            if (action === 'view') {
                // Add bank to opened_by
                result = await client.query(
                    'SELECT add_bank_to_opened_by($1, $2)',
                    [applicationId, bank_user_id]
                );
                
                if (result.rows[0].add_bank_to_opened_by) {
                    return NextResponse.json({
                        success: true,
                        message: 'Bank added to opened_by successfully',
                        data: { application_id: applicationId, bank_user_id, action: 'view' }
                    });
                } else {
                    return NextResponse.json({
                        success: false,
                        error: 'Bank already in opened_by or application not found'
                    }, { status: 400 });
                }
                
            } else if (action === 'purchase') {
                // Add bank to purchased_by (will check if in opened_by first)
                try {
                    result = await client.query(
                        'SELECT add_bank_to_purchased_by($1, $2)',
                        [applicationId, bank_user_id]
                    );
                    
                    if (result.rows[0].add_bank_to_purchased_by) {
                        return NextResponse.json({
                            success: true,
                            message: 'Bank added to purchased_by successfully',
                            data: { application_id: applicationId, bank_user_id, action: 'purchase' }
                        });
                    } else {
                        return NextResponse.json({
                            success: false,
                            error: 'Bank already in purchased_by or application not found'
                        }, { status: 400 });
                    }
                    
                } catch (error) {
                    if (error.message.includes('Bank must view application before purchasing')) {
                        return NextResponse.json({
                            success: false,
                            error: 'Bank must view application before purchasing'
                        }, { status: 400 });
                    }
                    throw error;
                }
            }

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Bank tracking action error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to perform bank tracking action' },
            { status: 500 }
        );
    }
}
