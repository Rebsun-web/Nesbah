// Server-side EmailJS for API routes
import emailjs from '@emailjs/nodejs';

// Check if email notifications are disabled
const isEmailDisabled = process.env.DISABLE_EMAIL_NOTIFICATIONS === 'true';

/**
 * Send newsletter subscription confirmation email (server-side)
 */
export async function sendNewsletterSubscriptionEmail(userEmail) {
    if (isEmailDisabled) {
        console.log(`📧 Email notifications disabled - skipping newsletter subscription email to ${userEmail}`);
        return { success: true, disabled: true, message: 'Email notifications are currently disabled' };
    }

    try {
        console.log(`📤 Sending newsletter subscription confirmation to ${userEmail}`);
        
        const response = await emailjs.send(
            process.env.EMAILJS_SERVICE_ID,
            process.env.EMAILJS_NEWSLETTER_SUBSCRIPTION_TEMPLATE_ID,
            {
                email: userEmail
            },
            {
                publicKey: process.env.EMAILJS_PUBLIC_KEY,
                privateKey: process.env.EMAILJS_PRIVATE_KEY
            }
        );
        
        console.log(`✅ Newsletter subscription email sent to ${userEmail}. Response:`, response);
        return { success: true, response };
    } catch (error) {
        console.error(`❌ Failed to send newsletter subscription email to ${userEmail}. Error:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Send application submission confirmation email (server-side)
 */
export async function sendApplicationSubmissionEmail(businessEmail, applicationData) {
    if (isEmailDisabled) {
        console.log(`📧 Email notifications disabled - skipping application submission email to ${businessEmail}`);
        return { success: true, disabled: true, message: 'Email notifications are currently disabled' };
    }

    try {
        console.log(`📤 Sending application submission confirmation to ${businessEmail}`);
        
        const response = await emailjs.send(
            process.env.EMAILJS_SERVICE_ID,
            process.env.EMAILJS_APPLICATION_SUBMITTED_TEMPLATE_ID,
            {
                to_email: businessEmail,
                business_name: applicationData.trade_name,
                application_id: applicationData.application_id,
                submitted_date: new Date(applicationData.submitted_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                auction_end_date: new Date(applicationData.auction_end_time).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                city_of_operation: applicationData.city_of_operation,
                number_of_pos_devices: applicationData.number_of_pos_devices,
                requested_amount: applicationData.approximate_financing_amount,
                repayment_period: applicationData.preferred_repayment_period_months
            },
            {
                publicKey: process.env.EMAILJS_PUBLIC_KEY,
                privateKey: process.env.EMAILJS_PRIVATE_KEY
            }
        );
        
        console.log(`✅ Application submission email sent to ${businessEmail}. Response:`, response);
        return { success: true, response };
    } catch (error) {
        console.error(`❌ Failed to send application submission email to ${businessEmail}. Error:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Send onboarding submission confirmation to business
 */
export async function sendSubmissionConfirmationEmail(toEmail, { reference_number, business_name }, label = 'business') {
    if (isEmailDisabled) return { success: true, disabled: true };
    if (!toEmail) return { success: false, error: 'No email provided' };

    try {
        const response = await emailjs.send(
            process.env.EMAILJS_SERVICE_ID,
            process.env.EMAILJS_SUBMISSION_TEMPLATE_ID,
            {
                email: toEmail,
                reference_number,
                business_name: business_name || '',
            },
            {
                publicKey: process.env.EMAILJS_PUBLIC_KEY,
                privateKey: process.env.EMAILJS_PRIVATE_KEY,
            }
        );
        console.log(`✅ Submission confirmation sent to ${label}: ${toEmail}`);
        return { success: true, response };
    } catch (error) {
        console.error(`❌ Failed to send submission confirmation to ${label} (${toEmail}):`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Send new-lead notification to all active bank users
 * Requires: EMAILJS_BANK_NEW_LEAD_TEMPLATE_ID env var
 * Template variables: {{to_email}}
 */
export async function sendBankNewLeadNotifications(bankEmails) {
    if (isEmailDisabled) return;
    if (!bankEmails || bankEmails.length === 0) return;

    const templateId = process.env.EMAILJS_BANK_NEW_LEAD_TEMPLATE_ID;
    if (!templateId) {
        console.warn('⚠️ EMAILJS_BANK_NEW_LEAD_TEMPLATE_ID not set — skipping bank notifications');
        return;
    }

    for (const email of bankEmails) {
        try {
            await emailjs.send(
                process.env.EMAILJS_SERVICE_ID,
                templateId,
                { to_email: email },
                {
                    publicKey: process.env.EMAILJS_PUBLIC_KEY,
                    privateKey: process.env.EMAILJS_PRIVATE_KEY,
                }
            );
            console.log(`✅ Submission confirmation sent to banks: ${email}`);
        } catch (error) {
            console.error(`❌ Failed to notify bank ${email}:`, error.message);
        }
    }
}

/**
 * Send admin alert when a new public lead is submitted
 * Requires: ADMIN_NOTIFICATION_EMAIL env var
 * Requires: EMAILJS_ADMIN_NEW_LEAD_TEMPLATE_ID env var (template vars: reference_number, financing_type, contact_person, contact_person_number, city_of_operation, business_name, submitted_at)
 */
export async function sendAdminNewLeadAlert(applicationData) {
    if (isEmailDisabled) return { success: true, disabled: true };

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!adminEmail) return { success: false, error: 'ADMIN_NOTIFICATION_EMAIL not set' };

    const templateId = process.env.EMAILJS_ADMIN_NEW_LEAD_TEMPLATE_ID;
    if (!templateId) return { success: false, error: 'EMAILJS_ADMIN_NEW_LEAD_TEMPLATE_ID not set' };

    try {
        const response = await emailjs.send(
            process.env.EMAILJS_SERVICE_ID,
            templateId,
            {
                to_email: adminEmail,
                reference_number: applicationData.reference_number,
                financing_type: applicationData.financing_type,
                contact_person: applicationData.contact_person,
                contact_person_number: applicationData.contact_person_number,
                city_of_operation: applicationData.city_of_operation || 'Not specified',
                business_name: applicationData.business_name || 'Unknown',
                submitted_at: new Date().toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }),
            },
            {
                publicKey: process.env.EMAILJS_PUBLIC_KEY,
                privateKey: process.env.EMAILJS_PRIVATE_KEY,
            }
        );
        console.log(`✅ Admin new-lead alert sent to ${adminEmail}`);
        return { success: true, response };
    } catch (error) {
        console.error(`❌ Failed to send admin new-lead alert:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Get email notification status
 */
export function getEmailNotificationStatus() {
    return {
        disabled: isEmailDisabled,
        message: isEmailDisabled ? 'Email notifications are currently disabled' : 'Email notifications are enabled',
        timestamp: new Date().toISOString()
    };
}
