import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

// GET - Fetch specific bank offer
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
        
        if (!id) {
            return NextResponse.json({ success: false, error: 'Offer ID is required' }, { status: 400 });
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_bank_offers_id_route.jsx_GET');
        
        try {
            // Fetch specific offer with related information
            const offerQuery = `
                SELECT 
                    ao.*,
                    -- Bank information
                    bu.entity_name as bank_entity_name,
                    bu.contact_person as bank_contact_person,
                    bu.contact_person_number as bank_contact_number,
                    bu.email as bank_email,
                    -- Application information
                    pa.trade_name as application_trade_name,
                    pa.cr_number as application_cr_number,
                    pa.cr_national_number as application_cr_national_number,
                    pa.city as application_city,
                    pa.legal_form as application_legal_form,
                    pa.registration_status as application_registration_status,
                    pa.requested_financing_amount as application_requested_amount,
                    pa.preferred_repayment_period_months as application_preferred_period,
                    pa.contact_person as application_contact_person,
                    pa.contact_person_number as application_contact_number,
                    pa.number_of_pos_devices as application_pos_devices,
                    pa.pos_provider_name as application_pos_provider,
                    pa.avg_monthly_pos_sales as application_monthly_sales,
                    pa.activities as application_activities,
                    pa.has_ecommerce as application_has_ecommerce,
                    pa.store_url as application_store_url,
                    pa.cr_capital as application_cr_capital,
                    pa.cash_capital as application_cash_capital,
                    pa.management_structure as application_management_structure,
                    pa.notes as application_notes,
                    pa.submitted_at as application_submitted_at,
                    pa.status as application_status,
                    -- User information
                    u.email as business_user_email,
                    u.user_type as business_user_type
                FROM application_offers ao
                LEFT JOIN bank_users bu ON ao.bank_user_id = bu.user_id
                LEFT JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
                LEFT JOIN users u ON pa.user_id = u.user_id
                WHERE ao.offer_id = $1
            `;
            
            const offerResult = await client.query(offerQuery, [id]);
            
            if (offerResult.rows.length === 0) {
                return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 });
            }
            
            return NextResponse.json({
                success: true,
                offer: offerResult.rows[0]
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error fetching bank offer:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT - Update bank offer
export async function PUT(req, { params }) {
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
        
        if (!id) {
            return NextResponse.json({ success: false, error: 'Offer ID is required' }, { status: 400 });
        }

        // Parse FormData
        const formData = await req.formData();
        
        // Extract form fields
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
        if (!approved_financing_amount || !proposed_repayment_period_months || 
            !interest_rate || !monthly_installment_amount) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_bank_offers_id_route.jsx_PUT');
        
        try {
            // Start transaction
            await client.query('BEGIN');
            
            // Update the offer
            const updateResult = await client.query(`
                UPDATE application_offers SET
                    approved_financing_amount = $1,
                    proposed_repayment_period_months = $2,
                    interest_rate = $3,
                    monthly_installment_amount = $4,
                    grace_period_months = $5,
                    offer_comment = $6,
                    offer_terms = $7,
                    admin_notes = $8,
                    updated_at = $9
                    ${uploaded_document ? ', uploaded_document = $10, uploaded_filename = $11, uploaded_mimetype = $12' : ''}
                WHERE offer_id = ${uploaded_document ? '$13' : '$10'}
                RETURNING *
            `, uploaded_document ? [
                parseFloat(approved_financing_amount),
                parseInt(proposed_repayment_period_months),
                parseFloat(interest_rate),
                parseFloat(monthly_installment_amount),
                grace_period_months ? parseInt(grace_period_months) : null,
                offer_comment || null,
                offer_terms || null,
                admin_notes || null,
                new Date(),
                uploaded_document,
                uploaded_filename,
                uploaded_mimetype,
                id
            ] : [
                parseFloat(approved_financing_amount),
                parseInt(proposed_repayment_period_months),
                parseFloat(interest_rate),
                parseFloat(monthly_installment_amount),
                grace_period_months ? parseInt(grace_period_months) : null,
                offer_comment || null,
                offer_terms || null,
                admin_notes || null,
                new Date(),
                id
            ]);
            
            if (updateResult.rows.length === 0) {
                throw new Error('Offer not found');
            }
            
            // Commit transaction
            await client.query('COMMIT');
            
            return NextResponse.json({
                success: true,
                message: 'Bank offer updated successfully',
                offer: updateResult.rows[0]
            });
            
        } catch (error) {
            // Rollback transaction on error
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Error updating bank offer:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error: ' + error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete bank offer
export async function DELETE(req, { params }) {
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
        
        if (!id) {
            return NextResponse.json({ success: false, error: 'Offer ID is required' }, { status: 400 });
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_bank_offers_id_route.jsx_DELETE');
        
        try {
            // Start transaction
            await client.query('BEGIN');
            
            // Get offer details before deletion for cleanup
            const offerQuery = await client.query(
                'SELECT submitted_application_id, bank_user_id FROM application_offers WHERE offer_id = $1',
                [id]
            );
            
            if (offerQuery.rows.length === 0) {
                throw new Error('Offer not found');
            }
            
            const { submitted_application_id, bank_user_id } = offerQuery.rows[0];
            
            // Delete from bank_offer_submissions
            await client.query(
                'DELETE FROM bank_offer_submissions WHERE offer_id = $1',
                [id]
            );
            
            // Delete the offer
            const deleteResult = await client.query(
                'DELETE FROM application_offers WHERE offer_id = $1 RETURNING *',
                [id]
            );
            
            if (deleteResult.rows.length === 0) {
                throw new Error('Offer not found');
            }
            
            // Update offers count in pos_application
            await client.query(`
                UPDATE pos_application 
                SET 
                    offers_count = GREATEST(COALESCE(offers_count, 0) - 1, 0),
                    purchased_by = array_remove(COALESCE(purchased_by, ARRAY[]::integer[]), $1)
                WHERE application_id = $2
            `, [bank_user_id, submitted_application_id]);
            
            // Commit transaction
            await client.query('COMMIT');
            
            return NextResponse.json({
                success: true,
                message: 'Bank offer deleted successfully'
            });
            
        } catch (error) {
            // Rollback transaction on error
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Error deleting bank offer:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error: ' + error.message },
            { status: 500 }
        );
    }
}
