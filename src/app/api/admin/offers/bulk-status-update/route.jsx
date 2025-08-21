import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(req) {
    try {
        // TODO: Add admin authentication middleware
        // const adminUser = await authenticateAdmin(req);
        // if (!adminUser) {
        //     return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        // }

        const body = await req.json();
        const {
            offer_ids,
            new_status,
            reason,
            admin_user_id = 1 // TODO: Get from authenticated admin session
        } = body;

        // Validate required fields
        if (!offer_ids || !Array.isArray(offer_ids) || offer_ids.length === 0) {
            return NextResponse.json(
                { success: false, error: 'offer_ids must be a non-empty array' },
                { status: 400 }
            );
        }

        if (!new_status || !['submitted', 'deal_won', 'deal_lost'].includes(new_status)) {
            return NextResponse.json(
                { success: false, error: 'new_status must be one of: submitted, deal_won, deal_lost' },
                { status: 400 }
            );
        }

        if (!reason) {
            return NextResponse.json(
                { success: false, error: 'reason is required for audit purposes' },
                { status: 400 }
            );
        }

        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Verify all offers exist and get their current status
            const offersQuery = await client.query(
                'SELECT offer_id, application_id, status FROM application_offers WHERE offer_id = ANY($1)',
                [offer_ids]
            );

            if (offersQuery.rows.length !== offer_ids.length) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'One or more offers not found' },
                    { status: 404 }
                );
            }

            const offers = offersQuery.rows;
            const applicationIds = [...new Set(offers.map(offer => offer.application_id))];

            // Update offer statuses
            await client.query(
                'UPDATE application_offers SET status = $1 WHERE offer_id = ANY($2)',
                [new_status, offer_ids]
            );

            // Log the bulk status update
            for (const offer of offers) {
                await client.query(
                    `
                    INSERT INTO offer_status_audit_log 
                        (offer_id, application_id, from_status, to_status, admin_user_id, reason, timestamp)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW())
                    `,
                    [offer.offer_id, offer.application_id, offer.status, new_status, admin_user_id, reason]
                );
            }

            // Update application offers count if needed
            for (const applicationId of applicationIds) {
                const offersCountQuery = await client.query(
                    'SELECT COUNT(*) as count FROM application_offers WHERE application_id = $1 AND status = $2',
                    [applicationId, 'submitted']
                );
                
                const offersCount = parseInt(offersCountQuery.rows[0].count);
                
                await client.query(
                    'UPDATE submitted_applications SET offers_count = $1 WHERE application_id = $2',
                    [offersCount, applicationId]
                );
            }

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: `Successfully updated ${offers.length} offers to status: ${new_status}`,
                data: {
                    updated_offers: offers.length,
                    new_status,
                    reason,
                    admin_user_id,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Admin bulk offer status update error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update offer statuses' },
            { status: 500 }
        );
    }
}

export async function GET(req) {
    try {
        // TODO: Add admin authentication middleware
        // const adminUser = await authenticateAdmin(req);
        // if (!adminUser) {
        //     return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        // }

        const { searchParams } = new URL(req.url);
        const application_id = searchParams.get('application_id');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit')) || 50;
        const offset = parseInt(searchParams.get('offset')) || 0;

        const client = await pool.connect();
        
        try {
            let query = `
                SELECT 
                    ao.offer_id,
                    ao.application_id,
                    ao.status,
                    ao.device_setup_fee,
                    ao.transaction_fees,
                    ao.settlement_time,
                    ao.uploaded_document,
                    ao.uploaded_filename,
                    ao.submitted_at,
                    pa.trade_name,
                    bu.entity_name as bank_name
                FROM application_offers ao
                JOIN pos_application pa ON ao.application_id = pa.application_id
                LEFT JOIN bank_users bu ON ao.submitted_by_user_id = bu.user_id
                WHERE 1=1
            `;

            const queryParams = [];
            let paramCount = 0;

            if (application_id) {
                paramCount++;
                query += ` AND ao.application_id = $${paramCount}`;
                queryParams.push(application_id);
            }

            if (status) {
                paramCount++;
                query += ` AND ao.status = $${paramCount}`;
                queryParams.push(status);
            }

            query += ` ORDER BY ao.submitted_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            queryParams.push(limit, offset);

            const result = await client.query(query, queryParams);

            // Get total count for pagination
            let countQuery = `
                SELECT COUNT(*) as total
                FROM application_offers ao
                WHERE 1=1
            `;

            const countParams = [];
            paramCount = 0;

            if (application_id) {
                paramCount++;
                countQuery += ` AND ao.application_id = $${paramCount}`;
                countParams.push(application_id);
            }

            if (status) {
                paramCount++;
                countQuery += ` AND ao.status = $${paramCount}`;
                countParams.push(status);
            }

            const countResult = await client.query(countQuery, countParams);
            const total = parseInt(countResult.rows[0].total);

            return NextResponse.json({
                success: true,
                data: {
                    offers: result.rows,
                    pagination: {
                        total,
                        limit,
                        offset,
                        has_more: offset + limit < total
                    }
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Admin offers list error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch offers' },
            { status: 500 }
        );
    }
}
