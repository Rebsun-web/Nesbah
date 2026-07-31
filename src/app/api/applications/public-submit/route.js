import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import wathiqAPIService from '@/lib/wathiq-api-service';
import { sendSubmissionConfirmationEmail, sendAdminNewLeadEmail, sendBankNewLeadNotifications } from '@/lib/email/serverEmailNotifications';
import { auctionConfig } from '@/lib/config/auction-config';
import { CR_NATIONAL_NUMBER_RE, SAUDI_MOBILE_RE, EMAIL_RE } from '@/lib/validators';
import {
    VALID_FINANCING_CODES,
    VALID_AMOUNT_CODES,
    VALID_AGE_CODES,
    VALID_REVENUE_CODES,
    VALID_SECTOR_CODES,
    VALID_CITY_CODES,
    CONSENT_VERSION,
    representativeAmount,
    formatAmountRange,
    formatCity,
    formatSector,
} from '@/lib/apply-options';
import { computeLeadScore } from '@/lib/lead-score';

// Generous but bounded — this is a public, unauthenticated endpoint, so free-text
// fields need a size cap before they reach the DB.
const MAX_SHORT_FIELD_LEN = 255;
const MAX_NOTES_LEN = 2000;

function generateReferenceNumber() {
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `NSB-${Date.now()}-${rand}`;
}

function poolSnap() {
    return { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount };
}

const SUBMIT_TIMEOUT_MS = 28000;

export async function POST(req) {
    const reqId = Math.random().toString(36).slice(2, 8).toUpperCase();
    const start = Date.now();
    const elapsed = () => `+${Date.now() - start}ms`;
    const log = (msg, extra) => console.log(`[SUBMIT:${reqId}] ${elapsed()} ${msg}`, extra || '');

    console.log(`[SUBMIT:${reqId}] ENTRY pool=${JSON.stringify(poolSnap())}`);

    try {
        const submitPromise = performSubmit(reqId, elapsed, log, req);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Submit timeout')), SUBMIT_TIMEOUT_MS)
        );
        const result = await Promise.race([submitPromise, timeoutPromise]);
        console.log(`[SUBMIT:${reqId}] DONE ${elapsed()} status=${result.status}`);
        return result;
    } catch (error) {
        if (error.message === 'Submit timeout') {
            console.error(`[SUBMIT:${reqId}] TIMEOUT after ${elapsed()} pool=${JSON.stringify(poolSnap())}`);
            return NextResponse.json(
                { success: false, error: 'Service temporarily unavailable, please try again' },
                { status: 503 }
            );
        }
        console.error(`[SUBMIT:${reqId}] OUTER_ERROR ${elapsed()}`, {
            message: error.message,
            code: error.code,
            stack: error.stack?.split('\n').slice(0, 4).join('\n'),
            pool: poolSnap(),
        });
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function performSubmit(reqId, elapsed, log, req) {
    const body = await req.json();
    const {
        cr_national_number,
        contact_person,
        contact_person_number,
        financing_type,
        notes,
        preferred_repayment_period_months,
        business_name,
        email,
        // Stable codes — see src/lib/apply-options.js. The form sends codes only;
        // the human-readable label is derived for display and for the legacy
        // free-text columns kept as a fallback for historical rows.
        city_code,
        sector_code,
        amount_range_code,
        business_age_range_code,
        annual_revenue_code,
        is_pre_revenue,
        has_pos,
        consent,
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

    if (!CR_NATIONAL_NUMBER_RE.test(cr_national_number.toString())) {
        log(`VALIDATION_FAIL cr_format cr=${cr_national_number}`);
        return NextResponse.json(
            { success: false, error: 'الرقم الوطني يجب أن يتكون من 10 أرقام ويبدأ بـ 70 / National number must be exactly 10 digits and start with 70' },
            { status: 400 }
        );
    }

    if (!SAUDI_MOBILE_RE.test(contact_person_number.toString().replace(/[\s-]/g, ''))) {
        log(`VALIDATION_FAIL phone_format`);
        return NextResponse.json(
            { success: false, error: 'يرجى إدخال رقم جوال سعودي صحيح / Enter a valid Saudi mobile number' },
            { status: 400 }
        );
    }

    if (email && !EMAIL_RE.test(email.toString().trim())) {
        log(`VALIDATION_FAIL email_format`);
        return NextResponse.json(
            { success: false, error: 'يرجى إدخال بريد إلكتروني صحيح / Enter a valid email address' },
            { status: 400 }
        );
    }

    if (!VALID_FINANCING_CODES.includes(financing_type)) {
        log(`VALIDATION_FAIL financing_type=${financing_type}`);
        return NextResponse.json(
            { success: false, error: `Invalid financing_type. Must be one of: ${VALID_FINANCING_CODES.join(', ')}` },
            { status: 400 }
        );
    }

    // Enumerated answers: every one is required and must be a known code. Codes
    // are validated here, before any DB call, so a bad payload never reaches the
    // CHECK constraints.
    const codeChecks = [
        ['city_code', city_code, VALID_CITY_CODES],
        ['sector_code', sector_code, VALID_SECTOR_CODES],
        ['amount_range_code', amount_range_code, VALID_AMOUNT_CODES],
        ['business_age_range_code', business_age_range_code, VALID_AGE_CODES],
    ];
    for (const [fieldName, value, validCodes] of codeChecks) {
        if (!value || !validCodes.includes(value)) {
            log(`VALIDATION_FAIL ${fieldName}=${value}`);
            return NextResponse.json(
                { success: false, error: `Invalid ${fieldName}. Must be one of: ${validCodes.join(', ')}` },
                { status: 400 }
            );
        }
    }

    // Annual revenue and the pre-revenue flag are mutually exclusive, and exactly
    // one of them must be answered.
    const isPreRevenue = is_pre_revenue === true;
    if (isPreRevenue && annual_revenue_code) {
        log('VALIDATION_FAIL revenue_and_pre_revenue_both_set');
        return NextResponse.json(
            { success: false, error: 'annual_revenue_code must be null when is_pre_revenue is true' },
            { status: 400 }
        );
    }
    if (!isPreRevenue && !VALID_REVENUE_CODES.includes(annual_revenue_code)) {
        log(`VALIDATION_FAIL annual_revenue_code=${annual_revenue_code}`);
        return NextResponse.json(
            { success: false, error: 'اختر الإيراد السنوي / Select annual revenue' },
            { status: 400 }
        );
    }

    // POS question: required, no default. Stored in the existing own_pos_system
    // boolean rather than a second near-identical column.
    if (typeof has_pos !== 'boolean') {
        log(`VALIDATION_FAIL has_pos=${has_pos}`);
        return NextResponse.json(
            { success: false, error: 'الإجابة مطلوبة / This answer is required' },
            { status: 400 }
        );
    }

    // Consent to share the application with financing partners is required, and
    // the accepted version is recorded on the row.
    if (consent !== true) {
        log('VALIDATION_FAIL consent_not_given');
        return NextResponse.json(
            { success: false, error: 'الموافقة على مشاركة البيانات مطلوبة / Consent to share your data is required' },
            { status: 400 }
        );
    }

    const shortFields = { business_name, contact_person };
    for (const [fieldName, value] of Object.entries(shortFields)) {
        if (value && value.toString().length > MAX_SHORT_FIELD_LEN) {
            log(`VALIDATION_FAIL field_too_long field=${fieldName}`);
            return NextResponse.json(
                { success: false, error: `${fieldName} must be at most ${MAX_SHORT_FIELD_LEN} characters` },
                { status: 400 }
            );
        }
    }
    if (notes && notes.toString().length > MAX_NOTES_LEN) {
        log('VALIDATION_FAIL notes_too_long');
        return NextResponse.json(
            { success: false, error: `Notes must be at most ${MAX_NOTES_LEN} characters` },
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

    // Codes are authoritative. The Arabic labels below are written to the legacy
    // free-text columns purely as a display fallback, so portal surfaces that
    // have not yet been migrated to the code formatters keep rendering correctly.
    const city_of_operation = formatCity(city_code, 'ar');
    const sector = formatSector(sector_code, 'ar');
    const approximate_financing_amount = formatAmountRange(amount_range_code, 'ar');
    // Legacy numeric column used by the older POS flow and by admin reporting.
    const requested_financing_amount = representativeAmount(amount_range_code);

    // Internal prioritization indicator — admins and financing partners only.
    // Never returned to the applicant. lead_tier is derived by a DB trigger.
    const lead_score = computeLeadScore({
        amountCode: amount_range_code,
        ageCode: business_age_range_code,
        hasPos: has_pos,
        isPreRevenue,
    });
    log(`LEAD_SCORE score=${lead_score}`);

    log(`POOL_CONNECT pool=${JSON.stringify(poolSnap())}`);
    const client = await pool.connectWithRetry(2, 1000, 'public-submit');
    log(`POOL_CONNECT_OK pool=${JSON.stringify(poolSnap())}`);

    const connState = { releaseErr: null };

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
                approximate_financing_amount,
                requested_financing_amount,
                city_code,
                sector_code,
                amount_range_code,
                business_age_range_code,
                annual_revenue_code,
                is_pre_revenue,
                own_pos_system,
                consent_at,
                consent_version,
                lead_score
            ) VALUES (
                NULL,
                $1, $2, 'live_auction', $3, $4, $5, $6,
                $7, $8, $9, $10, $11, $12,
                '{}', '{}',
                $13, $14, $15, $16,
                $17, $18, $19, $20, $21, $22, $23,
                $24, $25, $26
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
                requested_financing_amount,
                city_code,
                sector_code,
                amount_range_code,
                business_age_range_code,
                isPreRevenue ? null : annual_revenue_code,
                isPreRevenue,
                has_pos,
                submitted_at,
                CONSENT_VERSION,
                lead_score,
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
            sendAdminNewLeadEmail(adminEmail, {
                reference_number,
                business_name:         emailPayload.business_name,
                financing_type,
                cr_national_number,
                contact_person,
                contact_person_number,
                city_of_operation,
            }).catch((e) => log(`EMAIL_ADMIN_FAIL ${e.message}`));
        }

        // Notify partners of the new lead. Banks created as entities have no email,
        // so login-capable bank EMPLOYEE accounts are the notification target. Legacy
        // bank_user rows that still carry an email are included too (deduped in the sender).
        pool.query(
            `SELECT u.email FROM users u
             WHERE u.account_status = 'active'
               AND u.email IS NOT NULL
               AND u.user_type IN ('bank_user', 'bank_employee')`
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
        if (pool.isRetryableError(err)) connState.releaseErr = err;
        log(`DB_ERROR ${err.message} code=${err.code}`, { detail: err.detail, pool: poolSnap() });
        try { await client.query('ROLLBACK'); log('TX_ROLLBACK'); } catch {}
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    } finally {
        client.release(connState.releaseErr || undefined);
        log(`CLIENT_RELEASED${connState.releaseErr ? ' (destroyed—stale)' : ''} pool=${JSON.stringify(poolSnap())}`);
    }
}
