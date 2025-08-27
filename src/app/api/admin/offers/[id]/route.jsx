import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

// DELETE - Delete an offer
export async function DELETE(req, { params }) {
    try {
        const { id } = params;
        
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

        const client = await pool.connectWithRetry();
        
        try {
            // Check if offer exists
            const offerCheck = await client.query(
                'SELECT offer_id FROM application_offers WHERE offer_id = $1',
                [id]
            );
            
            if (offerCheck.rows.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'Offer not found' },
                    { status: 404 }
                );
            }

            // Delete the offer
            await client.query(
                'DELETE FROM application_offers WHERE offer_id = $1',
                [id]
            );

            return NextResponse.json({
                success: true,
                message: 'Offer deleted successfully'
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Delete offer error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete offer' },
            { status: 500 }
        );
    }
}

// PUT - Update an offer
export async function PUT(req, { params }) {
    try {
        const { id } = params;
        
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
        const client = await pool.connectWithRetry();
        
        try {
            // Check if offer exists
            const offerCheck = await client.query(
                'SELECT offer_id FROM application_offers WHERE offer_id = $1',
                [id]
            );
            
            if (offerCheck.rows.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'Offer not found' },
                    { status: 404 }
                );
            }

            // Update the offer
            const result = await client.query(`
                UPDATE application_offers SET
                    offer_device_setup_fee = $1,
                    offer_transaction_fee_mada = $2,
                    offer_transaction_fee_visa_mc = $3,
                    offer_settlement_time_mada = $4,
                    offer_settlement_time_visa_mc = $5,
                    offer_comment = $6,
                    offer_terms = $7,
                    offer_validity_days = $8,
                    status = $9,
                    bank_name = $10,
                    bank_contact_person = $11,
                    bank_contact_email = $12,
                    bank_contact_phone = $13,
                    includes_hardware = $14,
                    includes_software = $15,
                    includes_support = $16,
                    support_hours = $17,
                    warranty_months = $18,
                    pricing_tier = $19,
                    volume_discount_threshold = $20,
                    volume_discount_percentage = $21,
                    compliance_certifications = $22,
                    regulatory_approvals = $23,
                    settlement_time = $24,
                    deal_value = $25,
                    commission_rate = $26,
                    commission_amount = $27,
                    bank_revenue = $28,
                    admin_notes = $29,
                    is_featured = $30,
                    featured_reason = $31,
                    updated_at = NOW()
                WHERE offer_id = $32
                RETURNING offer_id
            `, [
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
                body.compliance_certifications || [],
                body.regulatory_approvals || [],
                body.settlement_time || '',
                body.deal_value || 0,
                body.commission_rate || 0,
                body.commission_amount || 0,
                body.bank_revenue || 0,
                body.admin_notes || '',
                body.is_featured || false,
                body.featured_reason || '',
                id
            ]);

            return NextResponse.json({
                success: true,
                offer_id: result.rows[0].offer_id,
                message: 'Offer updated successfully'
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Update offer error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update offer' },
            { status: 500 }
        );
    }
}
