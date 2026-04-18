import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import wathiqAPIService from '@/lib/wathiq-api-service';
import { sendSubmissionConfirmationEmail, sendBankNewLeadNotifications } from '@/lib/email/serverEmailNotifications';
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

function poolSnap() {
    return { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount };
}

export async function POST(req) {
    const reqId = Math.random().toString(36).slice(2, 8).toUpperCase();
    const start = Date.now();
    const elapsed = () => `+${Date.now() - start}ms`;
    const log = (msg, extra) => console.log(`[SUBMIT:${reqId}] ${elapsed()} ${msg}`, extra || '');

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
            business_name,
            email,
            sector,
            approximate_financing_amount,
        } = body;

        log(`START cr=****${String(cr_national_number || '').slice(-4)} type=${financing_type} pool=${JSON.stringify(poolSnap())}`);

        // Input validation
        if (!cr_national_number || !contact_person || !contact_person_number || !financing_type) {
            log('VALIDATION_FAIL missing_required_fields');
            return NextResponse.json(
                { success: false, error: 'Missing required fields: cr_national_number, contact_person, contact_person_number, financing_type' },
                { status: 400 }
            );
        }

        if (!/^7\d{9}$/.test(cr_national_number.toString())) {
            log(`VALIDATION_FAIL cr_format cr=${cr_national_number}`);
            return NextResponse.json(
                { success: false, error: 'الرقم الوطني يجب أن يتكون من 10 أرقام ويبدأ بالرقم 7 / National number must be exactly 10 digits and start with 7' },
                { status: 400 }
            );
        }

        if (!VALID_FINANCING_TYPES.includes(financing_type)) {
            log(`VALIDATION_FAIL financing_type=${financing_type}`);
            return NextResponse.json(
                { success: false, error: `Invalid financing_type. Must be one of: ${VALID_FINANCING_TYPES.join(', ')}` },
                { status: 400 }
            );
        }

        // Wathiq verification
        let wathiqData = null;
        let verification_status = 'pending';
        log('WATHIQ_START');
        try {
            wathiqData = await wathiqAPIService.fetchBusinessData(cr_national_number);
            if (wathiqData) {
                verification_status = 'verified';
                log(`WATHIQ_OK trade_name=${wathiqData.trade_name || '(none)'}`);
            }
        } catch (wathiqError) {
            const isUnreachable =
                wathiqError.name === 'AbortError' ||
                !wathiqError.message?.includes('Wathiq API error:');

            if (isUnreachable) {
                log(`WATHIQ_UNREACHABLE reason=${wathiqError.message} — proceeding with pending`);
                verification_status = 'pending';
            } else {
                log(`WATHIQ_REJECTED reason=${wathiqError.message}`);
                return NextResponse.json(
                    { success: false, errorCode: 'CR_NOT_FOUND' },
                    { status: 422 }
                );
            }
        }

        const reference_number = generateReferenceNumber();
        const submitted_at = new Date();
        const auction_end_time = new Date(submitted_at.getTime() + auctionConfig.durationMilliseconds);

        log(`POOL_CONNECT pool=${JSON.stringify(poolSnap())}`);
        const client = await pool.connectWithRetry(2, 1000, 'public-submit');
        log(`POOL_CONNECT_OK pool=${JSON.stringify(poolSnap())}`);

        try {
            log('DUPLICATE_CHECK');
            const existing = await client.query(
                'SELECT application_id FROM pos_application WHERE cr_national_number = $1 LIMIT 1',
                [cr_national_number]
            );
            if (existing.rows.length > 0) {
                log(`DUPLICATE_CR application_id=${existing.rows[0].application_id}`);
                return NextResponse.json(
                    { success: false, errorCode: 'DUPLICATE_CR' },
                    { status: 409 }
                );
            }
            log('DUPLICATE_CHECK_CLEAR');

            await client.query('BEGIN');
            log('TX_BEGIN');

            let wathiq_data_id = null;
            if (wathiqData) {
                log('WATHIQ_UPSERT');
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
                        cr_national_number,
                        wathiqData.cr_number || null,
                        wathiqData.trade_name || business_name || null,
                        wathiqData.legal_form || null,
                        wathiqData.registration_status || null,
                        wathiqData.issue_date_gregorian || null,
                        wathiqData.confirmation_date_gregorian || null,
                        wathiqData.city || city_of_operation || null,
                        wathiqData.has_ecommerce || false,
                        wathiqData.store_url || null,
                        wathiqData.cr_capital || null,
                        wathiqData.cash_capital || null,
                        wathiqData.in_kind_capital || null,
                        wathiqData.avg_capital || null,
                        wathiqData.management_structure || null,
                        wathiqData.management_managers ? JSON.stringify(wathiqData.management_managers) : null,
                        wathiqData.activities || null,
                        wathiqData.contact_info ? JSON.stringify(wathiqData.contact_info) : null,
                        wathiqData.sector || sector || null,
                    ]
                );
                wathiq_data_id = wathiqResult.rows[0].id;
                log(`WATHIQ_UPSERT_OK wathiq_data_id=${wathiq_data_id}`);
            }

            log('APPLICATION_INSERT');
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
                    reference_number,
                    financing_type,
                    submitted_at,
                    notes || null,
                    verification_status,
                    wathiq_data_id,
                    cr_national_number,
                    contact_person,
                    contact_person_number,
                    city_of_operation,
                    preferred_repayment_period_months || null,
                    auction_end_time,
                    sector || wathiqData?.sector || null,
                    email || null,
                    approximate_financing_amount || null,
                ]
            );

            const application_id = result.rows[0].application_id;
            log(`APPLICATION_INSERT_OK application_id=${application_id} ref=${reference_number}`);

            await client.query('COMMIT');
            log('TX_COMMIT');

            // Fire-and-forget emails
            const emailPayload = {
                reference_number,
                business_name: wathiqData?.trade_name || business_name || null,
            };
            if (email) {
                sendSubmissionConfirmationEmail(email, emailPayload).catch((e) =>
                    log(`EMAIL_BUSINESS_FAIL ${e.message}`)
                );
            }

            const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
            if (adminEmail) {
                sendSubmissionConfirmationEmail(adminEmail, emailPayload, 'admins').catch((e) =>
                    log(`EMAIL_ADMIN_FAIL ${e.message}`)
                );
            }

            pool.query(
                `SELECT u.email FROM users u WHERE u.user_type = 'bank_user' AND u.account_status = 'active'`
            ).then(r => {
                const emails = r.rows.map(row => row.email);
                log(`EMAIL_BANKS_SENDING count=${emails.length}`);
                return sendBankNewLeadNotifications(emails);
            }).catch((e) => log(`EMAIL_BANKS_FAIL ${e.message}`));

            log(`SUCCESS total=${elapsed()}`);
            return NextResponse.json({
                success: true,
                reference_number,
                application_id,
            });

        } catch (err) {
            log(`DB_ERROR ${err.message} code=${err.code}`, { detail: err.detail, pool: poolSnap() });
            try { await client.query('ROLLBACK'); log('TX_ROLLBACK'); } catch {}
            return NextResponse.json(
                { success: false, error: 'Internal server error' },
                { status: 500 }
            );
        } finally {
            client.release();
            log(`CLIENT_RELEASED pool=${JSON.stringify(poolSnap())}`);
        }

    } catch (err) {
        console.error(`[SUBMIT:${reqId}] ${elapsed()} OUTER_ERROR`, {
            message: err.message,
            code: err.code,
            stack: err.stack?.split('\n').slice(0, 4).join('\n'),
            pool: poolSnap(),
        });
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
