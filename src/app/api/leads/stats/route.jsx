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
        const { rows } = await pool.withConnectionRetry(async (client) => {
            // Get statistics for the bank
            return await client.query(
                `
                WITH incoming_leads AS (
                    -- Count all live auction applications the bank hasn't purchased yet
                    SELECT COUNT(*) as count
                    FROM pos_application pa
                    WHERE (${STATUS_FILTER_SQL}) = 'live_auction'
                      AND NOT $1 = ANY(pa.purchased_by)
                ),
                submitted_offers AS (
                    -- Count offers submitted by this bank
                    SELECT COUNT(*) as count
                    FROM application_offers ao
                    WHERE ao.bank_user_id = $1
                ),
                ignored_applications AS (
                    -- Count applications that ended without this bank purchasing
                    SELECT COUNT(*) as count
                    FROM pos_application pa
                    WHERE (${STATUS_FILTER_SQL}) IN ('completed', 'ignored')
                      AND NOT $1 = ANY(pa.purchased_by)
                )
                SELECT 
                    il.count as incoming_leads,
                    so.count as purchased_leads,
                    ia.count as ignored_leads
                FROM incoming_leads il, submitted_offers so, ignored_applications ia
                `,
                [bankUserId]
            );
        }, 3, 30000); // 3 retries, 30 second timeout
        
        if (rows.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    incoming_leads: 0,
                    purchased_leads: 0,
                    ignored_leads: 0
                },
                timestamp: new Date().toISOString()
            });
        }

        return NextResponse.json({
            success: true,
            data: rows[0],
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Failed to fetch lead statistics:', {
            error: err.message,
            code: err.code,
            stack: err.stack,
            bankUserId,
            timestamp: new Date().toISOString()
        });
        
        // Provide specific error responses based on error type
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
            error: 'Failed to fetch lead statistics. Please try again later.' 
        }, { status: 500 });
    }
}