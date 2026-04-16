import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import wathiqAPIService from '@/lib/wathiq-api-service';
import { sendSubmissionConfirmationEmail } from '@/lib/email/serverEmailNotifications';
import { auctionConfig } from '@/lib/config/auction-config';

const VALID_FINANCING_TYPES = [
    'pos',
    'working_capital',
    'equipment',
    'expansion',
    'project',
    'real_estate',
    'general',
    'business',
];

function generateReferenceNumber() {
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
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
            preferred_repayment_period_months,
            // Additional fields from Lovable form
            business_name,
            email,
            sector,
            approximate_financing_amount,
        } = body;

        // Input validation
        if (!cr_national_number || !contact_person || !contact_person_number || !financing_type) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: cr_national_number, contact_person, contact_person_number, financing_type' },
                { status: 400 }
            );
        }

        if (!/^7\d{9}$/.test(cr_national_number.toString())) {
            return NextResponse.json(
                { success: false, error: 'الرقم الوطني يجب أن يتكون من 10 أرقام ويبدأ بالرقم 7 / National number must be exactly 10 digits and start with 7' },
                { status: 400 }
            );
        }

        if (!VALID_FINANCING_TYPES.includes(financing_type)) {
            return NextResponse.json(
                { success: false, error: `Invalid financing_type. Must be one of: ${VALID_FINANCING_TYPES.join(', ')}` },
                { status: 400 }
            );
        }

        // Attempt Wathiq verification (AbortController timeout is inside the service — 7s)
        let wathiqData = null;
        let verification_status = 'pending';
        try {
            wathiqData = await wathiqAPIService.fetchBusinessData(cr_national_number);
            if (wathiqData) {
                verification_status = 'verified';
            }
        } catch (wathiqError) {
            const isUnreachable =
                wathiqError.name === 'AbortError' ||
                !wathiqError.message?.includes('Wathiq API error:');

            if (isUnreachable) {
                // Wathiq timed out or network error — not the user's fault, proceed
                console.warn('⚠️ Wathiq unreachable, proceeding with pending status:', wathiqError.message);
                verification_status = 'pending';
            } else {
                // Wathiq responded but rejected the CR — number doesn't exist or is invalid
                console.warn('⚠️ Wathiq rejected CR number:', wathiqError.message);
                return NextResponse.json(
                    { success: false, errorCode: 'CR_NOT_FOUND' },
                    { status: 422 }
                );
            }
        }

        const reference_number = generateReferenceNumber();
        const submitted_at = new Date();
        const auction_end_time = new Date(submitted_at.getTime() + auctionConfig.durationMilliseconds);

        const client = await pool.connectWithRetry(2, 1000, 'api_applications_public-submit_route.js');

        try {
            // Check uniqueness — one submission per national number
            const existing = await client.query(
                'SELECT application_id FROM pos_application WHERE cr_national_number = $1 LIMIT 1',
                [cr_national_number]
            );
            if (existing.rows.length > 0) {
                return NextResponse.json(
                    { success: false, errorCode: 'DUPLICATE_CR' },
                    { status: 409 }
                );
            }

            await client.query('BEGIN');

            // Upsert wathiq_data — single canonical store for all Wathiq fields.
            // ON CONFLICT: update all fields so re-submissions get fresh data.
            let wathiq_data_id = null;
            if (wathiqData) {
                const wathiqResult = await client.query(
                    `INSERT INTO wathiq_data (
                        cr_national_number,
                        cr_number,
                        trade_name,
                        legal_form,
                        registration_status,
                        issue_date_gregorian,
                        confirmation_date_gregorian,
                        city,
                        has_ecommerce,
                        store_url,
                        cr_capital,
                        cash_capital,
                        in_kind_capital,
                        avg_capital,
                        management_structure,
                        management_managers,
                        activities,
                        contact_info,
                        sector,
                        is_verified,
                        verification_date,
                        wathiq_fetched_at,
                        updated_at
                    ) VALUES (
                        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
                        TRUE, NOW(), NOW(), NOW()
                    )
                    ON CONFLICT (cr_national_number) DO UPDATE SET
                        cr_number                   = EXCLUDED.cr_number,
                        trade_name                  = EXCLUDED.trade_name,
                        legal_form                  = EXCLUDED.legal_form,
                        registration_status         = EXCLUDED.registration_status,
                        issue_date_gregorian        = EXCLUDED.issue_date_gregorian,
                        confirmation_date_gregorian = EXCLUDED.confirmation_date_gregorian,
                        city                        = EXCLUDED.city,
                        has_ecommerce               = EXCLUDED.has_ecommerce,
                        store_url                   = EXCLUDED.store_url,
                        cr_capital                  = EXCLUDED.cr_capital,
                        cash_capital                = EXCLUDED.cash_capital,
                        in_kind_capital             = EXCLUDED.in_kind_capital,
                        avg_capital                 = EXCLUDED.avg_capital,
                        management_structure        = EXCLUDED.management_structure,
                        management_managers         = EXCLUDED.management_managers,
                        activities                  = EXCLUDED.activities,
                        contact_info                = EXCLUDED.contact_info,
                        sector                      = EXCLUDED.sector,
                        is_verified                 = TRUE,
                        verification_date           = NOW(),
                        wathiq_fetched_at           = NOW(),
                        updated_at                  = NOW()
                    RETURNING id`,
                    [
                        cr_national_number,                                        // $1
                        wathiqData.cr_number || null,                              // $2
                        wathiqData.trade_name || business_name || null,            // $3
                        wathiqData.legal_form || null,                             // $4
                        wathiqData.registration_status || null,                    // $5
                        wathiqData.issue_date_gregorian || null,                   // $6
                        wathiqData.confirmation_date_gregorian || null,            // $7
                        wathiqData.city || city_of_operation || null,              // $8
                        wathiqData.has_ecommerce || false,                         // $9
                        wathiqData.store_url || null,                              // $10
                        wathiqData.cr_capital || null,                             // $11
                        wathiqData.cash_capital || null,                           // $12
                        wathiqData.in_kind_capital || null,                        // $13
                        wathiqData.avg_capital || null,                            // $14
                        wathiqData.management_structure || null,                   // $15
                        wathiqData.management_managers ? JSON.stringify(wathiqData.management_managers) : null, // $16
                        wathiqData.activities || null,                             // $17
                        wathiqData.contact_info ? JSON.stringify(wathiqData.contact_info) : null, // $18
                        wathiqData.sector || sector || null,                       // $19
                    ]
                );
                wathiq_data_id = wathiqResult.rows[0].id;
            }

            const result = await client.query(
                `INSERT INTO pos_application (
                    user_id,
                    reference_number,
                    financing_type,
                    status,
                    submitted_at,
                    notes,
                    verification_status,
                    wathiq_data_id,
                    cr_national_number,
                    contact_person,
                    contact_person_number,
                    city_of_operation,
                    preferred_repayment_period_months,
                    auction_end_time,
                    opened_by,
                    purchased_by,
                    sector,
                    business_contact_email,
                    approximate_financing_amount
                ) VALUES (
                    NULL,
                    $1, $2, 'live_auction', $3, $4, $5, $6,
                    $7, $8, $9, $10, $11, $12,
                    '{}', '{}',
                    $13, $14, $15
                )
                RETURNING application_id`,
                [
                    reference_number,                                    // $1
                    financing_type,                                      // $2
                    submitted_at,                                        // $3
                    notes || null,                                       // $4
                    verification_status,                                 // $5
                    wathiq_data_id,                                      // $6
                    cr_national_number,                                  // $7
                    contact_person,                                      // $8
                    contact_person_number,                               // $9
                    city_of_operation,                                   // $10
                    preferred_repayment_period_months || null,           // $11
                    auction_end_time,                                    // $12
                    sector || wathiqData?.sector || null,                // $13
                    email || null,                                       // $14
                    approximate_financing_amount || null,                // $15
                ]
            );

            const application_id = result.rows[0].application_id;

            await client.query('COMMIT');

            // Send confirmation email to business — fire and forget, never block submission
            if (email) {
                sendSubmissionConfirmationEmail(email, {
                    reference_number,
                    business_name: wathiqData?.trade_name || business_name || null,
                }).catch(() => {});
            }

            return NextResponse.json({
                success: true,
                reference_number,
                application_id,
            });

        } catch (err) {
            console.error('❌ public-submit DB error:', {
                message: err.message,
                code: err.code,
                detail: err.detail,
                cr_national_number,
                financing_type,
            });
            try { await client.query('ROLLBACK'); } catch {}
            return NextResponse.json(
                { success: false, error: 'Internal server error' },
                { status: 500 }
            );
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('❌ public-submit outer error:', {
            message: err.message,
            code: err.code,
            stack: err.stack?.split('\n').slice(0, 4).join('\n'),
        });
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
