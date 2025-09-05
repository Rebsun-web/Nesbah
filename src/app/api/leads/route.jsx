import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateAPIRequest } from '@/lib/auth/api-auth';
import { STATUS_FILTER_SQL } from '@/lib/application-status';

export async function GET(req) {
    // Authenticate the request
    const authResult = await authenticateAPIRequest(req, 'bank_user');
    if (!authResult.success) {
        return NextResponse.json(
            { success: false, error: authResult.error },
            { status: authResult.status || 401 }
        );
    }
    
    let bankUserId = authResult.user.user_id;
    
    // If this is a bank employee, get the main bank user ID
    if (authResult.user.user_type === 'bank_employee') {
        try {
            const bankEmployeeResult = await pool.withConnectionRetry(async (client) => {
                return await client.query(
                    'SELECT bank_user_id FROM bank_employees WHERE user_id = $1',
                    [authResult.user.user_id]
                );
            }, 3, 15000); // 3 retries, 15 second timeout
            
            if (bankEmployeeResult.rows.length > 0) {
                bankUserId = bankEmployeeResult.rows[0].bank_user_id;
            }
        } catch (error) {
            console.error('Error getting bank user ID for employee:', {
                error: error.message,
                code: error.code,
                userId: authResult.user.user_id,
                timestamp: new Date().toISOString()
            });
            
            // Provide specific error responses based on error type
            if (error.message === 'Query timeout') {
                return NextResponse.json({ 
                    success: false, 
                    error: 'Database query timed out. Please try again.' 
                }, { status: 408 });
            }
            
            if (pool.isRetryableError(error)) {
                return NextResponse.json({ 
                    success: false, 
                    error: 'Database temporarily unavailable. Please try again in a moment.' 
                }, { status: 503 });
            }
            
            return NextResponse.json({ 
                success: false, 
                error: 'Failed to get bank information' 
            }, { status: 500 });
        }
    }

    try {
        // Use enhanced connection management with timeout and retry
        const result = await pool.withConnectionRetry(async (client) => {
            // UPDATED: Show all live auction applications that the bank hasn't purchased yet
            return await client.query(
                `SELECT 
                    pa.application_id,
                    COALESCE(pa.current_application_status, pa.status) as status,
                    pa.auction_end_time,
                    pa.offers_count,
                    pa.revenue_collected,
                    pa.submitted_at,
                    pa.trade_name as company_name,
                    pa.city_of_operation as city,
                    pa.contact_person,
                    pa.contact_person_number,
                    pa.cr_number,
                    bu.sector,
                    'POS' as application_type,
                    -- Wathiq Business Data (Required fields as per specification)
                    bu.cr_national_number,
                    bu.legal_form,
                    bu.registration_status,
                    bu.issue_date_gregorian,
                    bu.activities,
                    bu.cr_capital,
                    bu.cash_capital,
                    bu.in_kind_capital,
                    bu.avg_capital,
                    bu.has_ecommerce,
                    bu.store_url,
                    bu.management_structure,
                    bu.management_managers,
                    bu.contact_info,
                    -- New POS Application Fields
                    pa.pos_provider_name as pos_provider,
                    pa.pos_age_duration_months as pos_age,
                    pa.avg_monthly_pos_sales as monthly_sales,
                    pa.requested_financing_amount as financing_amount,
                    pa.preferred_repayment_period_months as repayment_period,
                    -- Check if bank has already viewed this application
                    CASE WHEN $1 = ANY(pa.opened_by) THEN true ELSE false END as has_viewed,
                    -- Check if bank has already purchased this application
                    CASE WHEN $1 = ANY(pa.purchased_by) THEN true ELSE false END as has_purchased
                 FROM pos_application pa
                 INNER JOIN business_users bu ON pa.user_id = bu.user_id
                 WHERE (${STATUS_FILTER_SQL}) = 'live_auction'
                   AND NOT $1 = ANY(pa.purchased_by)  -- Only show applications bank hasn't purchased
                 ORDER BY pa.submitted_at DESC`,
                [bankUserId]
            );
        }, 3, 30000); // 3 retries, 30 second timeout

        return NextResponse.json({ 
            success: true, 
            data: result.rows,
            count: result.rows.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Failed to fetch leads:', {
            error: err.message,
            code: err.code,
            stack: err.stack,
            bankUserId,
            timestamp: new Date().toISOString()
        });
        
        // Provide more specific error messages based on error type
        if (err.message === 'Query timeout') {
            return NextResponse.json({ 
                success: false, 
                error: 'Database query timed out. Please try again.' 
            }, { status: 408 });
        }
        
        if (err.code === '53300' || err.message.includes('connection slots are reserved')) {
            return NextResponse.json({ 
                success: false, 
                error: 'Database temporarily unavailable. Please try again in a moment.' 
            }, { status: 503 });
        }
        
        if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
            return NextResponse.json({ 
                success: false, 
                error: 'Database connection lost. Please try again.' 
            }, { status: 503 });
        }
        
        if (err.code === '23505') { // Unique constraint violation
            return NextResponse.json({ 
                success: false, 
                error: 'Data integrity error. Please contact support.' 
            }, { status: 409 });
        }
        
        if (err.code === '42P01') { // Undefined table
            return NextResponse.json({ 
                success: false, 
                error: 'Database schema error. Please contact support.' 
            }, { status: 500 });
        }
        
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to fetch leads. Please try again later.' 
        }, { status: 500 });
    }
}