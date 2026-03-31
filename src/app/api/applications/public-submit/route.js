import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import wathiqAPIService from '@/lib/wathiq-api-service';
import { sendNewApplicationNotificationToBanks } from '@/lib/email/emailNotifications';
import { auctionConfig } from '@/lib/config/auction-config';

const VALID_FINANCING_TYPES = [
    'pos',
    'working_capital',
    'equipment',
    'expansion',
    'project',
    'real_estate',
    'general',
];

function generateReferenceNumber() {
    const rand = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `NSB-${Date.now()}-${rand}`;
}

export async function POST(req) {
    try {
        const body = await req.json();

        const {
            cr_national_number,
            contact_person,
            contact_person_number,
            city_of_operation,
            financing_type,
            notes,
            requested_financing_amount,
            preferred_repayment_period_months,
            // Additional fields from Lovable form
            business_name,
            email,
            sector,
        } = body;

        // Input validation
        if (!cr_national_number || !contact_person || !contact_person_number || !city_of_operation || !financing_type) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: cr_national_number, contact_person, contact_person_number, city_of_operation, financing_type' },
                { status: 400 }
            );
        }

        if (!VALID_FINANCING_TYPES.includes(financing_type)) {
            return NextResponse.json(
                { success: false, error: `Invalid financing_type. Must be one of: ${VALID_FINANCING_TYPES.join(', ')}` },
                { status: 400 }
            );
        }

        // Attempt Wathiq verification — non-blocking if it fails
        let wathiqData = null;
        let verification_status = 'pending';
        try {
            wathiqData = await wathiqAPIService.fetchBusinessData(cr_national_number);
            if (wathiqData) {
                verification_status = 'verified';
            }
        } catch (wathiqError) {
            // Store submission anyway — flag for manual review
            verification_status = 'pending';
        }

        const reference_number = generateReferenceNumber();
        const submitted_at = new Date();
        const auction_end_time = new Date(submitted_at.getTime() + auctionConfig.durationMilliseconds);

        const client = await pool.connectWithRetry(2, 1000, 'api_applications_public-submit_route.js');

        try {
            await client.query('BEGIN');

            const result = await client.query(
                `INSERT INTO pos_application (
                    user_id,
                    reference_number,
                    financing_type,
                    status,
                    submitted_at,
                    notes,
                    verification_status,
                    -- Wathiq-populated fields (null if Wathiq failed)
                    trade_name,
                    cr_number,
                    cr_national_number,
                    legal_form,
                    registration_status,
                    issue_date_gregorian,
                    city,
                    has_ecommerce,
                    store_url,
                    cr_capital,
                    cash_capital,
                    management_structure,
                    -- Form fields
                    contact_person,
                    contact_person_number,
                    city_of_operation,
                    requested_financing_amount,
                    preferred_repayment_period_months,
                    auction_end_time,
                    opened_by,
                    purchased_by
                ) VALUES (
                    NULL,
                    $1, $2, 'live_auction', $3, $4, $5,
                    $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
                    $18, $19, $20, $21, $22, $23,
                    '{}', '{}'
                )
                RETURNING application_id`,
                [
                    reference_number,                                       // $1
                    financing_type,                                          // $2
                    submitted_at,                                            // $3
                    notes || null,                                           // $4
                    verification_status,                                     // $5
                    wathiqData?.trade_name || business_name || null,         // $6
                    wathiqData?.cr_number || null,                           // $7
                    cr_national_number,                                      // $8
                    wathiqData?.legal_form || null,                          // $9
                    wathiqData?.registration_status || null,                 // $10
                    wathiqData?.issue_date_gregorian || null,                // $11
                    wathiqData?.city || city_of_operation,                   // $12
                    wathiqData?.has_ecommerce || null,                       // $13
                    wathiqData?.store_url || null,                           // $14
                    wathiqData?.cr_capital || null,                          // $15
                    wathiqData?.cash_capital || null,                        // $16
                    wathiqData?.management_structure || null,                // $17
                    contact_person,                                          // $18
                    contact_person_number,                                   // $19
                    city_of_operation,                                       // $20
                    requested_financing_amount || null,                      // $21
                    preferred_repayment_period_months || null,               // $22
                    auction_end_time,                                        // $23
                ]
            );

            const application_id = result.rows[0].application_id;

            // Notify banks about the new lead
            const bankUsersResult = await client.query(
                'SELECT email FROM users WHERE user_type = $1 AND account_status = $2',
                ['bank_user', 'active']
            );

            await client.query('COMMIT');

            const bankEmails = bankUsersResult.rows.map(row => row.email).filter(Boolean);
            if (bankEmails.length > 0) {
                try {
                    await sendNewApplicationNotificationToBanks(bankEmails, {
                        application_id,
                        trade_name: wathiqData?.trade_name || business_name || cr_national_number,
                        cr_number: wathiqData?.cr_number || cr_national_number,
                        city: wathiqData?.city || city_of_operation,
                        legal_form: wathiqData?.legal_form || null,
                        submitted_at,
                        auction_end_time,
                        city_of_operation,
                        requested_financing_amount: requested_financing_amount || null,
                        preferred_repayment_period_months: preferred_repayment_period_months || null,
                    });
                } catch (emailError) {
                    // Don't fail the submission if email fails
                }
            }

            return NextResponse.json({
                success: true,
                reference_number,
                application_id,
            });

        } catch (err) {
            await client.query('ROLLBACK');
            return NextResponse.json(
                { success: false, error: 'Internal server error' },
                { status: 500 }
            );
        } finally {
            client.release();
        }

    } catch (err) {
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
