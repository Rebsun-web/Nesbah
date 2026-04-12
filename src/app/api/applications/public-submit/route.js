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

        // Attempt Wathiq verification — 8s timeout so a hung API never blocks submission
        let wathiqData = null;
        let verification_status = 'pending';
        try {
            const wathiqTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Wathiq timeout after 8000ms')), 8000)
            );
            wathiqData = await Promise.race([
                wathiqAPIService.fetchBusinessData(cr_national_number),
                wathiqTimeout,
            ]);
            if (wathiqData) {
                verification_status = 'verified';
            }
        } catch (wathiqError) {
            const msg = wathiqError.message || '';
            console.warn('⚠️ Wathiq verification skipped:', msg);
            // 400 from Wathiq = invalid CR number — reject the submission
            if (msg.includes('400')) {
                return NextResponse.json(
                    { success: false, error: 'الرقم الوطني غير صحيح. يرجى التحقق من الرقم والمحاولة مجدداً. / Invalid national number. Please check and try again.' },
                    { status: 422 }
                );
            }
            // Timeout, network error, auth error — proceed with pending status
            verification_status = 'pending';
        }

        const reference_number = generateReferenceNumber();
        const submitted_at = new Date();
        const auction_end_time = new Date(submitted_at.getTime() + auctionConfig.durationMilliseconds);

        const client = await pool.connectWithRetry(2, 1000, 'api_applications_public-submit_route.js');

        // Check uniqueness — one submission per national number
        const existing = await client.query(
            'SELECT application_id FROM pos_application WHERE cr_national_number = $1 LIMIT 1',
            [cr_national_number]
        );
        if (existing.rows.length > 0) {
            client.release();
            return NextResponse.json(
                { success: false, error: 'تم تقديم طلب بهذا الرقم الوطني مسبقاً / A request with this national number has already been submitted' },
                { status: 409 }
            );
        }

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
                    purchased_by,
                    sector,
                    business_contact_email,
                    approximate_financing_amount
                ) VALUES (
                    NULL,
                    $1, $2, 'live_auction', $3, $4, $5,
                    $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
                    $18, $19, $20, $21, $22, $23,
                    '{}', '{}',
                    $24, $25, $26
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
                    null,                                                    // $21 (requested_financing_amount — legacy, unused)
                    preferred_repayment_period_months || null,               // $22
                    auction_end_time,                                        // $23
                    sector || null,                                          // $24
                    email || null,                                           // $25
                    approximate_financing_amount || null,                    // $26
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
            console.error('❌ public-submit INSERT failed:', {
                message: err.message,
                code: err.code,
                detail: err.detail,
                cr_national_number,
                financing_type,
            });
            await client.query('ROLLBACK');
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
