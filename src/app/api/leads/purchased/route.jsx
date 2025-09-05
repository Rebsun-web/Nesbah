import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateAPIRequest } from '@/lib/auth/api-auth';
import { STATUS_CALCULATION_SQL } from '@/lib/application-status';

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
            const bankEmployeeResult = await pool.query(
                'SELECT bank_user_id FROM bank_employees WHERE user_id = $1',
                [authResult.user.user_id]
            );
            
            if (bankEmployeeResult.rows.length > 0) {
                bankUserId = bankEmployeeResult.rows[0].bank_user_id;
            }
        } catch (error) {
            console.error('Error getting bank user ID for employee:', error);
            return NextResponse.json({ success: false, error: 'Failed to get bank information' }, { status: 500 });
        }
    }

    try {
        // First, get all the leads
        const leadsResult = await pool.query(
            `SELECT DISTINCT
                pa.application_id,
                ${STATUS_CALCULATION_SQL},
                pa.submitted_at,
                pa.auction_end_time,
                pa.offers_count,
                pa.revenue_collected,
                
                -- Business Information (Wathiq API data)
                bu.trade_name,
                bu.cr_number,
                bu.cr_national_number,
                bu.registration_status,
                bu.address,
                bu.sector,
                bu.cr_capital,
                bu.cash_capital,
                bu.in_kind_capital,
                bu.has_ecommerce,
                bu.store_url,
                bu.legal_form,
                bu.issue_date_gregorian,
                bu.management_structure,
                bu.management_managers,
                bu.contact_info,
                
                -- Application Details
                pa.notes,
                pa.number_of_pos_devices,
                pa.city_of_operation,
                pa.own_pos_system,
                pa.uploaded_filename,
                pa.pos_provider_name,
                pa.pos_age_duration_months,
                pa.avg_monthly_pos_sales,
                pa.requested_financing_amount,
                pa.preferred_repayment_period_months,
                
                -- Business Owner Personal Details (NOT from Wathiq API)
                pa.contact_person,
                pa.contact_person_number,
                u.email as business_contact_email,
                
                -- Lead Status Information
                CASE 
                    WHEN $1 = ANY(pa.purchased_by) THEN 'purchased'
                    WHEN EXISTS (SELECT 1 FROM application_offers WHERE submitted_application_id = pa.application_id AND submitted_by_user_id = $1) THEN 'offer_submitted'
                    ELSE 'unknown'
                END as lead_status
                
             FROM pos_application pa
             JOIN business_users bu ON pa.user_id = bu.user_id
             JOIN users u ON bu.user_id = u.user_id
             WHERE $1 = ANY(pa.purchased_by) 
                OR EXISTS (SELECT 1 FROM application_offers WHERE submitted_application_id = pa.application_id AND submitted_by_user_id = $1)
             ORDER BY pa.submitted_at DESC`,
            [bankUserId]
        );

        // Now get offers for each lead
        const leads = leadsResult.rows;
        const leadsWithOffers = [];

        for (const lead of leads) {
            // Get offers for this lead
            const offersResult = await pool.query(
                `SELECT 
                    ao.offer_id as id,
                    ao.submitted_at,
                    ao.approved_financing_amount as approved_amount,
                    ao.proposed_repayment_period_months as repayment_period_months,
                    ao.interest_rate,
                    ao.monthly_installment_amount as monthly_installment,
                    ao.grace_period_months,
                    ao.offer_comment,
                    ao.status,
                    ao.uploaded_filename,
                    bu.entity_name as submitted_by_bank_name
                FROM application_offers ao
                LEFT JOIN users bu ON ao.submitted_by_user_id = bu.user_id
                WHERE ao.submitted_application_id = $1 AND ao.submitted_by_user_id = $2
                ORDER BY ao.submitted_at DESC`,
                [lead.application_id, bankUserId]
            );

            leadsWithOffers.push({
                ...lead,
                offers: offersResult.rows
            });
        }

        return NextResponse.json({ success: true, data: leadsWithOffers });
    } catch (err) {
        console.error('Failed to fetch purchased leads:', err);
        return NextResponse.json({ success: false, error: 'Failed to fetch purchased leads' }, { status: 500 });
    }
}
