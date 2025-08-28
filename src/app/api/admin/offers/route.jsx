import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

// GET - List offers with filtering, sorting, and pagination
export async function GET(req) {
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

        // Get admin user from session (no database query needed)
        const adminUser = sessionValidation.adminUser;

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';
        const bankFilter = searchParams.get('bank') || 'all';
        const sortBy = searchParams.get('sortBy') || 'submitted_at';
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        
        const offset = (page - 1) * limit;

        const client = await pool.connectWithRetry();
        
        try {
            // Build WHERE clause
            let whereConditions = [];
            let queryParams = [];
            let paramCount = 0;

            if (search) {
                paramCount++;
                whereConditions.push(`(pa.trade_name ILIKE $${paramCount} OR u.entity_name ILIKE $${paramCount} OR ao.offer_id::text ILIKE $${paramCount})`);
                queryParams.push(`%${search}%`);
            }


            if (bankFilter !== 'all') {
                paramCount++;
                whereConditions.push(`u.entity_name = $${paramCount}`);
                queryParams.push(bankFilter);
            }

            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

            // Count total offers
            const countQuery = `
                SELECT COUNT(*) as total
                FROM application_offers ao
                JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
                JOIN users u ON ao.bank_user_id = u.user_id
                ${whereClause}
            `;
            
            const countResult = await client.query(countQuery, queryParams);
            const total = parseInt(countResult.rows[0].total);

            // Build the main query
            const query = `
                SELECT 
                    ao.offer_id,
                    ao.submitted_application_id,
                    ao.bank_user_id,
                    ao.offer_device_setup_fee,
                    ao.offer_transaction_fee_mada,
                    ao.offer_transaction_fee_visa_mc,
                    ao.offer_settlement_time_mada,
                    ao.offer_settlement_time_visa_mc,
                    ao.offer_comment,
                    ao.offer_terms,
                    ao.offer_validity_days,
                    ao.status,
                    ao.submitted_at,
                    ao.accepted_at,
                    ao.expires_at,
                    ao.bank_name,
                    ao.bank_contact_person,
                    ao.bank_contact_email,
                    ao.bank_contact_phone,
                    ao.includes_hardware,
                    ao.includes_software,
                    ao.includes_support,
                    ao.support_hours,
                    ao.warranty_months,
                    ao.pricing_tier,
                    ao.volume_discount_threshold,
                    ao.volume_discount_percentage,
                    ao.settlement_time,
                    ao.deal_value,
                    ao.commission_rate,
                    ao.commission_amount,
                    ao.bank_revenue,
                    ao.admin_notes,
                    ao.is_featured,
                    ao.featured_reason,
                    pa.trade_name as business_name,
                    pa.city as business_city,
                    pa.contact_person as business_contact,
                    pa.contact_person_number as business_phone,
                    pa.application_id,
                    u.entity_name as bank_name,
                    u.email as bank_email,
                    bu.logo_url as bank_logo,
                    COALESCE(pa.current_application_status, pa.status) as application_status,
                    pa.revenue_collected,
                    pa.offers_count
                FROM application_offers ao
                JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
                JOIN users u ON ao.bank_user_id = u.user_id
                LEFT JOIN bank_users bu ON ao.bank_user_id = bu.user_id
                ${whereClause}
                ORDER BY ao.${sortBy} ${sortOrder.toUpperCase()}
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;
            
            queryParams.push(limit, offset);
            const offersResult = await client.query(query, queryParams);

            return NextResponse.json({
                success: true,
                offers: offersResult.rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Offers list error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch offers' },
            { status: 500 }
        );
    }
}

// POST - Create new offer
export async function POST(req) {
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

        // Get admin user from session (no database query needed)
        const adminUser = sessionValidation.adminUser;

        const body = await req.json();
        
        // Validate required fields
        if (!body.application_id || !body.bank_user_id) {
            return NextResponse.json(
                { success: false, error: 'Application ID and Bank User ID are required' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry();
        
        try {
            // Verify application exists
            const appQuery = await client.query(`
                SELECT application_id FROM pos_application 
                WHERE application_id = $1
            `, [body.application_id]);
            
            if (appQuery.rows.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'Application not found' },
                    { status: 404 }
                );
            }
            
            // Calculate deal value
            const setupFee = parseFloat(body.offer_device_setup_fee) || 0;
            const madaFee = parseFloat(body.offer_transaction_fee_mada) || 0;
            const dealValue = setupFee > 0 ? setupFee + (setupFee * (madaFee / 100)) : 0;
            
            // Calculate commission amount
            const commissionRate = parseFloat(body.commission_rate) || 0;
            const commissionAmount = dealValue > 0 ? (dealValue * commissionRate / 100) : 0;
            
            // Insert new offer
            const result = await client.query(`
                INSERT INTO application_offers (
                    submitted_application_id,
                    bank_user_id,
                    offer_device_setup_fee,
                    offer_transaction_fee_mada,
                    offer_transaction_fee_visa_mc,
                    offer_settlement_time_mada,
                    offer_settlement_time_visa_mc,
                    offer_comment,
                    offer_terms,
                    offer_validity_days,
                    status,
                    bank_name,
                    bank_contact_person,
                    bank_contact_email,
                    bank_contact_phone,
                    includes_hardware,
                    includes_software,
                    includes_support,
                    support_hours,
                    warranty_months,
                    pricing_tier,
                    volume_discount_threshold,
                    volume_discount_percentage,
                    settlement_time,
                    deal_value,
                    commission_rate,
                    commission_amount,
                    bank_revenue,
                    admin_notes,
                    is_featured,
                    featured_reason,
                    submitted_at,
                    expires_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
                RETURNING offer_id
            `, [
                body.application_id, // Use application_id directly as submitted_application_id
                body.bank_user_id,
                body.offer_device_setup_fee || 0,
                body.offer_transaction_fee_mada || 0,
                body.offer_transaction_fee_visa_mc || 0,
                body.offer_settlement_time_mada || 0,
                body.offer_settlement_time_visa_mc || 0,
                body.offer_comment || '',
                body.offer_terms || '',
                body.offer_validity_days || 30,
                body.status || 'submitted',
                body.bank_name || '',
                body.bank_contact_person || '',
                body.bank_contact_email || '',
                body.bank_contact_phone || '',
                body.includes_hardware || false,
                body.includes_software || false,
                body.includes_support || false,
                body.support_hours || '',
                body.warranty_months || 0,
                body.pricing_tier || '',
                body.volume_discount_threshold || 0,
                body.volume_discount_percentage || 0,
                body.settlement_time || '',
                dealValue,
                body.commission_rate || 0,
                commissionAmount,
                body.bank_revenue || 0,
                body.admin_notes || '',
                body.is_featured || false,
                body.featured_reason || '',
                new Date(), // submitted_at
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // expires_at (30 days from now)
            ]);

            // Update offers count and add bank to purchased_by array in pos_application
            await client.query(`
                UPDATE pos_application 
                SET 
                    offers_count = offers_count + 1,
                    purchased_by = CASE 
                        WHEN $2 = ANY(purchased_by) THEN purchased_by 
                        ELSE array_append(purchased_by, $2)
                    END,
                    revenue_collected = revenue_collected + 25.00
                WHERE application_id = $1
            `, [body.application_id, body.bank_user_id]);

            // Get the full offer details to return
            const offerId = result.rows[0].offer_id;
            const fullOfferQuery = await client.query(`
                SELECT 
                    ao.offer_id,
                    ao.submitted_application_id,
                    ao.bank_user_id,
                    ao.status,
                    ao.submitted_at,
                    ao.offer_device_setup_fee,
                    ao.offer_transaction_fee_mada,
                    ao.offer_transaction_fee_visa_mc,
                    ao.offer_settlement_time_mada,
                    ao.offer_settlement_time_visa_mc,
                    ao.offer_comment,
                    ao.deal_value,
                    ao.commission_rate,
                    ao.includes_hardware,
                    ao.includes_software,
                    ao.includes_support,
                    ao.support_hours,
                    ao.warranty_months,
                    ao.admin_notes,
                    pa.trade_name as business_name,
                    pa.application_id,
                    u.entity_name as bank_name
                FROM application_offers ao
                JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
                JOIN users u ON ao.bank_user_id = u.user_id
                WHERE ao.offer_id = $1
            `, [offerId]);

            return NextResponse.json({
                success: true,
                offer: fullOfferQuery.rows[0],
                message: 'Offer created successfully'
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Create offer error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create offer' },
            { status: 500 }
        );
    }
}
