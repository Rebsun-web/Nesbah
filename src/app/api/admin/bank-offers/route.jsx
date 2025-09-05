import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';
import { STATUS_CALCULATION_SQL } from '@/lib/application-status';
import { validateApplicationStatus } from '@/lib/status-validation';

// GET - Fetch all bank offers using EXACT same schema as business-bank actions
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

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_bank_offers_route.jsx_GET');
        
        try {
            // Fetch all bank offers with related information (same structure as business-bank actions)
            const offersQuery = `
                SELECT 
                    ao.offer_id,
                    ao.submitted_application_id,
                    ao.bank_user_id,
                    ao.submitted_by_user_id,
                    ao.approved_financing_amount,
                    ao.proposed_repayment_period_months,
                    ao.interest_rate,
                    ao.monthly_installment_amount,
                    ao.grace_period_months,
                    ao.relationship_manager_name,
                    ao.offer_comment,
                    ao.bank_name,
                    ao.status,
                    ao.submitted_at,
                    ao.accepted_at,
                    ao.expires_at,
                    ao.offer_device_setup_fee,
                    ao.offer_transaction_fee_mada,
                    ao.offer_transaction_fee_visa_mc,
                    ao.offer_settlement_time_mada,
                    ao.offer_settlement_time_visa_mc,
                    ao.offer_terms,
                    ao.offer_validity_days,
                    ao.settlement_time,
                    ao.deal_value,
                    ao.commission_rate,
                    ao.commission_amount,
                    ao.bank_revenue,
                    ao.admin_notes,
                    ao.is_featured,
                    ao.featured_reason,
                    ao.uploaded_document,
                    ao.uploaded_mimetype,
                    ao.uploaded_filename,
                    ao.created_at,
                    ao.updated_at,
                    -- Bank information (same as business-bank actions)
                    u.entity_name as bank_entity_name,
                    u.email as bank_email,
                    bu.logo_url as bank_logo_url,
                    -- Application information (same as business-bank actions)
                    pa.trade_name as business_name,
                    pa.city as business_city,
                    pa.contact_person as business_contact,
                    pa.contact_person_number as business_phone,
                    pa.application_id,
                    pa.status as application_status,
                    pa.auction_end_time,
                    pa.offers_count,
                    pa.opened_by,
                    pa.purchased_by,
                    pa.cr_number,
                    pa.cr_national_number,
                    pa.cr_capital,
                    pa.legal_form,
                    pa.registration_status,
                    bu_user.email as business_email,
                    pa.preferred_repayment_period_months as preferred_repayment_period,
                    pa.requested_financing_amount,
                    -- Calculated application status using standardized logic
                    ${STATUS_CALCULATION_SQL}
                FROM application_offers ao
                LEFT JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
                LEFT JOIN users u ON ao.bank_user_id = u.user_id
                LEFT JOIN bank_users bu ON ao.bank_user_id = bu.user_id
                LEFT JOIN users bu_user ON pa.user_id = bu_user.user_id
                ORDER BY ao.submitted_at DESC
            `;
            
            const offersResult = await client.query(offersQuery);
            
            return NextResponse.json({
                success: true,
                offers: offersResult.rows,
                total: offersResult.rows.length
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error fetching bank offers:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Create new bank offer using EXACT same schema as business-bank actions
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

        // Parse FormData for file upload support
        const formData = await req.formData();
        
        // Extract form fields
        const cr_number = formData.get('cr_number');
        const bank_user_id = formData.get('bank_user_id');
        const approved_financing_amount = formData.get('approved_financing_amount');
        const proposed_repayment_period_months = formData.get('proposed_repayment_period_months');
        const interest_rate = formData.get('interest_rate');
        const monthly_installment_amount = formData.get('monthly_installment_amount');
        const grace_period_months = formData.get('grace_period_months');
        const offer_comment = formData.get('offer_comment');
        const offer_terms = formData.get('offer_terms');
        const admin_notes = formData.get('admin_notes');
        
        // Handle file upload
        const uploaded_document = formData.get('uploaded_document');
        const uploaded_filename = formData.get('uploaded_filename');
        const uploaded_mimetype = formData.get('uploaded_mimetype');
        
        // Validate required fields
        if (!cr_number || !bank_user_id || !approved_financing_amount || 
            !proposed_repayment_period_months || !interest_rate || !monthly_installment_amount) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: CR Number, Bank, Approved Financing Amount, Proposed Repayment Period, Interest Rate, and Monthly Installment Amount are required' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_bank_offers_route.jsx_POST');
        
        try {
            // Start transaction
            await client.query('BEGIN');
            
            // 1. Validate CR Number and find business application
            const businessCheck = await client.query(`
                SELECT 
                    pa.application_id,
                    pa.status,
                    pa.auction_end_time,
                    pa.offers_count,
                    pa.trade_name,
                    pa.city,
                    pa.cr_capital,
                    pa.preferred_repayment_period_months,
                    pa.legal_form,
                    pa.registration_status,
                    pa.contact_person,
                    pa.contact_person_number,
                    u.email as business_email,
                    bu.user_id as business_user_id
                FROM pos_application pa
                JOIN business_users bu ON pa.user_id = bu.user_id
                JOIN users u ON bu.user_id = u.user_id
                WHERE bu.cr_number = $1
                ORDER BY pa.submitted_at DESC
                LIMIT 1
            `, [cr_number]);
            
            if (businessCheck.rows.length === 0) {
                throw new Error(`No business found with CR Number: ${cr_number}`);
            }
            
            const business = businessCheck.rows[0];
            
            // Validate and correct application status automatically
            const validationResult = await validateApplicationStatus(
                business.application_id, 
                business.status
            );
            
            // Use validated status for all checks
            const actualStatus = validationResult.status;
            
            // Log if status was corrected
            if (validationResult.wasCorrected) {
                console.log(`🔄 Bank offers API: Status corrected for application ${business.application_id} from ${validationResult.previousStatus} to ${validationResult.status}`);
            }
            
            // Check if application is in live_auction status
            if (actualStatus !== 'live_auction') {
                throw new Error(`Business application is not in live auction status. Current validated status: ${actualStatus} (Previous DB status: ${business.status})`);
            }
            
            // Check if auction has expired (redundant but kept for clarity)
            if (business.auction_end_time && business.auction_end_time < new Date()) {
                throw new Error('Business application auction has expired');
            }
            
            // Check if this bank has already submitted an offer for this application
            const existingOfferCheck = await client.query(`
                SELECT offer_id FROM application_offers 
                WHERE submitted_application_id = $1 AND bank_user_id = $2
            `, [business.application_id, bank_user_id]);
            
            if (existingOfferCheck.rows.length > 0) {
                throw new Error('This bank has already submitted an offer for this business application');
            }
            
            // 2. Validate bank user
            const bankInfo = await client.query(`
                SELECT entity_name, email FROM users 
                WHERE user_id = $1 AND user_type = $2
            `, [bank_user_id, 'bank_user']);
            
            if (bankInfo.rows.length === 0) {
                throw new Error('Bank user not found or invalid user type');
            }
            
            const bankName = bankInfo.rows[0].entity_name;
            const bankEmail = bankInfo.rows[0].email;
            
            // 3. Insert new offer with essential information only
            const offerResult = await client.query(`
                INSERT INTO application_offers (
                    submitted_application_id,
                    bank_user_id,
                    submitted_by_user_id,
                    approved_financing_amount,
                    proposed_repayment_period_months,
                    interest_rate,
                    monthly_installment_amount,
                    grace_period_months,
                    offer_comment,
                    offer_terms,
                    bank_name,
                    status,
                    submitted_at,
                    expires_at,
                    admin_notes,
                    uploaded_document,
                    uploaded_filename,
                    uploaded_mimetype
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                RETURNING offer_id
            `, [
                business.application_id,
                bank_user_id,
                bank_user_id, // submitted_by_user_id same as bank_user_id
                parseFloat(approved_financing_amount),
                parseInt(proposed_repayment_period_months),
                parseFloat(interest_rate),
                parseFloat(monthly_installment_amount),
                grace_period_months ? parseInt(grace_period_months) : null,
                offer_comment || null,
                offer_terms || null,
                bankName,
                'submitted',
                new Date(),
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                admin_notes || null,
                uploaded_document || null,
                uploaded_filename || null,
                uploaded_mimetype || null
            ]);
            
            const offerId = offerResult.rows[0].offer_id;
            
            // 4. Update or insert into bank_offer_submissions for tracking
            await client.query(`
                INSERT INTO bank_offer_submissions (
                    application_id,
                    bank_user_id,
                    bank_name,
                    offer_id,
                    submitted_at
                ) VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (application_id, bank_user_id) 
                DO UPDATE SET 
                    offer_id = EXCLUDED.offer_id,
                    submitted_at = EXCLUDED.submitted_at
            `, [business.application_id, bank_user_id, bankName, offerId, new Date()]);
            
            // 5. Update offers count and purchased_by array in pos_application
            await client.query(`
                UPDATE pos_application 
                SET 
                    offers_count = COALESCE(offers_count, 0) + 1,
                    purchased_by = CASE 
                        WHEN $2 = ANY(COALESCE(purchased_by, ARRAY[]::integer[])) THEN COALESCE(purchased_by, ARRAY[]::integer[])
                        ELSE array_append(COALESCE(purchased_by, ARRAY[]::integer[]), $2)
                    END
                WHERE application_id = $1
            `, [business.application_id, bank_user_id]);
            
            // Commit transaction
            await client.query('COMMIT');
            
            // Get the created offer details
            const createdOffer = await client.query(`
                SELECT 
                    ao.*,
                    pa.trade_name as business_name,
                    pa.cr_number,
                    pa.city as business_city,
                    pa.cr_capital,
                    pa.contact_person as business_contact,
                    pa.contact_person_number as business_phone,
                    pa.business_email
                FROM application_offers ao
                JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
                WHERE ao.offer_id = $1
            `, [offerId]);
            
            return NextResponse.json({
                success: true,
                message: 'Bank offer created successfully',
                offer: createdOffer.rows[0],
                business_info: {
                    trade_name: business.trade_name,
                    cr_number: business.cr_number,
                    city: business.city,
                    cr_capital: business.cr_capital,
                    legal_form: business.legal_form,
                    registration_status: business.registration_status,
                    business_email: business.business_email,
                    contact_person: business.contact_person,
                    contact_phone: business.contact_person_number
                }
            });
            
        } catch (error) {
            // Rollback transaction on error
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Error creating bank offer:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error: ' + error.message },
            { status: 500 }
        );
    }
}
