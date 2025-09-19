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
                requested_amount: applicationData.requested_financing_amount,
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
 * Get email notification status
 */
export function getEmailNotificationStatus() {
    return {
        disabled: isEmailDisabled,
        message: isEmailDisabled ? 'Email notifications are currently disabled' : 'Email notifications are enabled',
        timestamp: new Date().toISOString()
    };
}
