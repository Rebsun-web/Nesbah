// Server-side email via EmailJS REST API (no SDK — avoids @emailjs/nodejs v5 auth bugs)

import { formatFinancingType } from '@/lib/apply-options';

const isEmailDisabled = process.env.DISABLE_EMAIL_NOTIFICATIONS === 'true';

/**
 * Raw call to the EmailJS REST API.
 * Returns the response text on success, throws on HTTP error.
 */
async function emailjsSend(templateId, templateParams, timeoutMs = 8000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_id:      process.env.EMAILJS_SERVICE_ID,
                template_id:     templateId,
                user_id:         process.env.EMAILJS_PUBLIC_KEY,
                accessToken:     process.env.EMAILJS_PRIVATE_KEY,
                template_params: templateParams,
            }),
            signal: controller.signal,
        });

        const text = await res.text();
        if (!res.ok) throw { status: res.status, text };
        return text;
    } finally {
        clearTimeout(timeoutId);
    }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Spacing between bulk sends, to stay under EmailJS per-second/rate limits.
const BULK_THROTTLE_MS = Number(process.env.EMAILJS_THROTTLE_MS) || 400;
// Max attempts per email before giving up.
const MAX_EMAIL_RETRIES = Number(process.env.EMAILJS_MAX_RETRIES) || 3;

// An error is worth retrying if it's a rate-limit (429), a transient server
// error (5xx), or a network/timeout error (no HTTP status attached).
function isRetryableEmailError(error) {
    if (!error) return false;
    if (error.name === 'AbortError') return true;      // timed out
    if (typeof error.status !== 'number') return true;  // network failure
    return error.status === 429 || error.status >= 500;
}

/**
 * emailjsSend with retry + exponential backoff. On a 429, honours EmailJS's
 * pacing by backing off before the next attempt. Throws the last error if all
 * attempts fail.
 */
async function emailjsSendWithRetry(templateId, templateParams, timeoutMs = 8000) {
    let lastError;
    for (let attempt = 1; attempt <= MAX_EMAIL_RETRIES; attempt++) {
        try {
            return await emailjsSend(templateId, templateParams, timeoutMs);
        } catch (error) {
            lastError = error;
            if (attempt === MAX_EMAIL_RETRIES || !isRetryableEmailError(error)) break;
            // Exponential backoff: 500ms, 1000ms, 2000ms... + jitter.
            const backoff = 500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
            console.warn(`⏳ EmailJS send attempt ${attempt} failed (retryable), backing off ${backoff}ms`);
            await sleep(backoff);
        }
    }
    throw lastError;
}

/**
 * Send newsletter subscription confirmation email
 */
export async function sendNewsletterSubscriptionEmail(userEmail) {
    if (isEmailDisabled) return { success: true, disabled: true };
    try {
        console.log(`📤 Sending newsletter confirmation to ${userEmail}`);
        await emailjsSendWithRetry(process.env.EMAILJS_NEWSLETTER_SUBSCRIPTION_TEMPLATE_ID, { email: userEmail });
        console.log(`✅ Newsletter confirmation sent to ${userEmail}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Failed newsletter confirmation to ${userEmail}:`, JSON.stringify(error));
        return { success: false, error: JSON.stringify(error) };
    }
}

/**
 * Send submission confirmation to business or admin (same template)
 * label: 'business' | 'admins'
 */
export async function sendSubmissionConfirmationEmail(toEmail, { reference_number, business_name }, label = 'business') {
    if (isEmailDisabled) return { success: true, disabled: true };
    if (!toEmail) return { success: false, error: 'No email provided' };

    try {
        await emailjsSendWithRetry(process.env.EMAILJS_SUBMISSION_TEMPLATE_ID, {
            email:            toEmail,
            reference_number,
            business_name:    business_name || '',
        });
        console.log(`✅ Submission confirmation sent to ${label}: ${toEmail}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Failed to send submission confirmation to ${label} (${toEmail}):`, JSON.stringify(error));
        return { success: false, error: JSON.stringify(error) };
    }
}

/**
 * Send new-lead notification to all active bank users
 */
export async function sendBankNewLeadNotifications(bankEmails) {
    if (isEmailDisabled) return;
    if (!bankEmails || bankEmails.length === 0) return;

    const templateId = process.env.EMAILJS_BANK_NEW_LEAD_TEMPLATE_ID;
    if (!templateId) {
        console.warn('⚠️ EMAILJS_BANK_NEW_LEAD_TEMPLATE_ID not set — skipping bank notifications');
        return;
    }

    // De-duplicate to avoid sending the same partner multiple emails.
    const uniqueEmails = [...new Set(bankEmails.filter(Boolean))];

    for (let i = 0; i < uniqueEmails.length; i++) {
        const email = uniqueEmails[i];
        try {
            await emailjsSendWithRetry(templateId, { to_email: email });
            console.log(`✅ New-lead notification sent to: ${email}`);
        } catch (error) {
            console.error(`❌ Failed to notify ${email}:`, JSON.stringify(error));
        }
        // Throttle between sends (skip after the last one) to respect rate limits.
        if (i < uniqueEmails.length - 1) {
            await sleep(BULK_THROTTLE_MS);
        }
    }
}

/**
 * Send new-lead notification to admin with full application context.
 * Uses EMAILJS_ADMIN_NEW_LEAD_TEMPLATE_ID if set, falls back to EMAILJS_SUBMISSION_TEMPLATE_ID.
 */
export async function sendAdminNewLeadEmail(adminEmail, {
    reference_number,
    business_name,
    financing_type,
    cr_national_number,
    contact_person,
    contact_person_number,
    city_of_operation,
}) {
    if (isEmailDisabled) return { success: true, disabled: true };
    if (!adminEmail) return { success: false, error: 'No admin email provided' };

    const templateId = process.env.EMAILJS_ADMIN_NEW_LEAD_TEMPLATE_ID || process.env.EMAILJS_SUBMISSION_TEMPLATE_ID;
    if (!templateId) {
        console.warn('⚠️ No admin notification template configured — skipping admin email');
        return { success: false, error: 'No admin template configured' };
    }

    try {
        await emailjsSendWithRetry(templateId, {
            email:                adminEmail,
            reference_number,
            business_name:        business_name || '',
            // Readable label, not the stored code — this goes to a human.
            financing_type:       financing_type ? formatFinancingType(financing_type, 'ar') : '',
            cr_national_number:   cr_national_number || '',
            contact_person:       contact_person || '',
            contact_person_number: contact_person_number || '',
            city_of_operation:    city_of_operation || '',
        });
        console.log(`✅ Admin new lead notification sent to ${adminEmail}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Failed to send admin new lead notification to ${adminEmail}:`, JSON.stringify(error));
        return { success: false, error: JSON.stringify(error) };
    }
}

/**
 * Send application submission confirmation email (legacy — kept for existing callers)
 */
export async function sendApplicationSubmissionEmail(businessEmail, applicationData) {
    if (isEmailDisabled) return { success: true, disabled: true };
    try {
        await emailjsSendWithRetry(process.env.EMAILJS_APPLICATION_SUBMITTED_TEMPLATE_ID, {
            to_email:          businessEmail,
            business_name:     applicationData.trade_name,
            application_id:    applicationData.application_id,
            city_of_operation: applicationData.city_of_operation,
            requested_amount:  applicationData.approximate_financing_amount,
            repayment_period:  applicationData.preferred_repayment_period_months,
        });
        console.log(`✅ Application submission email sent to ${businessEmail}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Failed application submission email to ${businessEmail}:`, JSON.stringify(error));
        return { success: false, error: JSON.stringify(error) };
    }
}

export function getEmailNotificationStatus() {
    return {
        disabled: isEmailDisabled,
        message:  isEmailDisabled ? 'Email notifications are currently disabled' : 'Email notifications are enabled',
        timestamp: new Date().toISOString(),
    };
}
