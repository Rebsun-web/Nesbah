import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req) {
    try {
        const formData = await req.formData();
        
        // Extract form data
        const leadId = formData.get('leadId');
        const bankUserId = formData.get('bankUserId');
        const approvedAmount = formData.get('approvedAmount');
        const repaymentPeriod = formData.get('repaymentPeriod');
        const interestRate = formData.get('interestRate');
        const monthlyInstallment = formData.get('monthlyInstallment');
        const gracePeriod = formData.get('gracePeriod');
        const relationshipManagerContact = formData.get('relationshipManagerContact');
        const comment = formData.get('comment');
        
        // Debug logging
        console.log('📝 Form data received:', {
            leadId,
            bankUserId,
            approvedAmount,
            repaymentPeriod,
            interestRate,
            monthlyInstallment,
            gracePeriod,
            relationshipManagerContact,
            comment
        });
        
        // Validate required fields
        if (!leadId || !bankUserId || !approvedAmount || !repaymentPeriod || !interestRate || !monthlyInstallment) {
            console.log('❌ Missing required fields:', {
                leadId: !!leadId,
                bankUserId: !!bankUserId,
                approvedAmount: !!approvedAmount,
                repaymentPeriod: !!repaymentPeriod,
                interestRate: !!interestRate,
                monthlyInstallment: !!monthlyInstallment
            });
            return NextResponse.json({
                success: false,
                message: 'Missing required fields: leadId, bankUserId, approvedAmount, repaymentPeriod, interestRate, monthlyInstallment are required'
            }, { status: 400 });
        }
        
        // Validate bankUserId is a valid integer
        const bankUserIdInt = parseInt(bankUserId);
        if (isNaN(bankUserIdInt)) {
            console.log('❌ Invalid bankUserId:', bankUserId);
            return NextResponse.json({
                success: false,
                message: 'Invalid bankUserId: must be a valid integer'
            }, { status: 400 });
        }

        const client = await pool.connectWithRetry(2, 1000, 'bank-submit-offer');
        
        try {
            // Start transaction
            await client.query('BEGIN');
            
            // Get bank information
            const bankInfo = await client.query(
                'SELECT entity_name FROM users WHERE user_id = $1',
                [bankUserIdInt]
            );
            
            if (bankInfo.rows.length === 0) {
                throw new Error('Bank user not found');
            }
            
            const bankName = bankInfo.rows[0].entity_name;
            
            // Check if this bank has already submitted an offer for this application
            const existingOfferCheck = await client.query(`
                SELECT offer_id FROM application_offers 
                WHERE submitted_application_id = $1 AND bank_user_id = $2
            `, [leadId, bankUserIdInt]);
            
            if (existingOfferCheck.rows.length > 0) {
                throw new Error('You have already submitted an offer for this application');
            }
            
            // Insert offer into application_offers table
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
                    relationship_manager_name,
                    offer_comment,
                    bank_name,
                    status,
                    submitted_at,
                    expires_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING offer_id
            `, [
                leadId,
                bankUserIdInt,
                bankUserIdInt,
                parseFloat(approvedAmount),
                parseInt(repaymentPeriod),
                parseFloat(interestRate),
                parseFloat(monthlyInstallment),
                gracePeriod ? parseInt(gracePeriod) : null,
                relationshipManagerContact || null,
                comment || null,
                bankName,
                'live_auction',
                new Date(),
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            ]);
            
            const offerId = offerResult.rows[0].offer_id;
            
            // Update or insert into bank_offer_submissions for tracking
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
            `, [leadId, bankUserIdInt, bankName, offerId, new Date()]);
            
            // Update offers count in pos_application
            await client.query(`
                UPDATE pos_application 
                SET 
                    offers_count = COALESCE(offers_count, 0) + 1,
                    purchased_by = CASE 
                        WHEN $2 = ANY(COALESCE(purchased_by, ARRAY[]::integer[])) THEN COALESCE(purchased_by, ARRAY[]::integer[])
                        ELSE array_append(COALESCE(purchased_by, ARRAY[]::integer[]), $2)
                    END
                WHERE application_id = $1
            `, [leadId, bankUserIdInt]);
            
            // Commit transaction
            await client.query('COMMIT');
            
            return NextResponse.json({
                success: true,
                message: 'Offer submitted successfully',
                offerId: offerId
            });
            
        } catch (error) {
            // Rollback transaction on error
            await client.query('ROLLBACK');
            console.error('Error submitting offer:', error);
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Error in submit-offer API:', error);
        return NextResponse.json({
            success: false,
            message: 'Internal server error: ' + error.message
        }, { status: 500 });
    }
}
