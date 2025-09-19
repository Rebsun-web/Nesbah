// EmailJS client-side approach (works from browser)
import emailjs from '@emailjs/browser';

// Check if email notifications are disabled
const isEmailDisabled = process.env.DISABLE_EMAIL_NOTIFICATIONS === 'true';

/**
 * Send application submission confirmation email to business user
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
 * Send auction completion email to business user
 */
export async function sendAuctionCompletionEmail(businessEmail, applicationData, offersCount) {
    if (isEmailDisabled) {
        console.log(`📧 Email notifications disabled - skipping auction completion email to ${businessEmail}`);
        return { success: true, disabled: true, message: 'Email notifications are currently disabled' };
    }

    try {
        console.log(`📤 Sending auction completion notification to ${businessEmail}`);
        
        const templateId = offersCount > 0 
            ? process.env.EMAILJS_AUCTION_SUCCESS_TEMPLATE_ID 
            : process.env.EMAILJS_AUCTION_NO_OFFERS_TEMPLATE_ID;
        
        const response = await emailjs.send(
            process.env.EMAILJS_SERVICE_ID,
            templateId,
            {
                to_email: businessEmail,
                business_name: applicationData.trade_name,
                application_id: applicationData.application_id,
                submitted_date: new Date(applicationData.submitted_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                auction_end_date: new Date(applicationData.auction_end_time).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                offers_received: offersCount,
                city_of_operation: applicationData.city_of_operation,
                requested_amount: applicationData.requested_financing_amount
            }
        );
        
        console.log(`✅ Auction completion email sent to ${businessEmail}. Response:`, response);
        return { success: true, response };
    } catch (error) {
        console.error(`❌ Failed to send auction completion email to ${businessEmail}. Error:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Send new application notification to banks
 */
export async function sendNewApplicationNotificationToBanks(bankEmails, applicationData) {
    if (isEmailDisabled) {
        console.log(`📧 Email notifications disabled - skipping bank notifications to ${bankEmails.length} banks`);
        return { success: true, disabled: true, message: 'Email notifications are currently disabled' };
    }

    try {
        console.log(`📤 Sending new application notifications to ${bankEmails.length} banks`);
        
        const emailPromises = bankEmails.map(async (bankEmail) => {
            try {
                const response = await emailjs.send(
                    process.env.EMAILJS_SERVICE_ID,
                    process.env.EMAILJS_NEW_APPLICATION_LEAD_TEMPLATE_ID,
                    {
                        to_email: bankEmail,
                        business_name: applicationData.trade_name,
                        application_id: applicationData.application_id,
                        city_of_operation: applicationData.city_of_operation,
                        number_of_pos_devices: applicationData.number_of_pos_devices,
                        requested_amount: applicationData.requested_financing_amount,
                        repayment_period: applicationData.preferred_repayment_period_months,
                        auction_end_date: new Date(applicationData.auction_end_time).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        business_cr_number: applicationData.cr_number,
                        business_city: applicationData.city,
                        business_legal_form: applicationData.legal_form
                    }
                );
                
                console.log(`✅ New application notification sent to ${bankEmail}`);
                return { success: true, email: bankEmail, response };
            } catch (error) {
                console.error(`❌ Failed to send new application notification to ${bankEmail}. Error:`, error);
                return { success: false, email: bankEmail, error: error.message };
            }
        });
        
        const results = await Promise.allSettled(emailPromises);
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;
        
        console.log(`📊 Bank notification results: ${successful} successful, ${failed} failed`);
        return { success: true, successful, failed, results };
    } catch (error) {
        console.error(`❌ Failed to send bank notifications. Error:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Send offer submission confirmation to business user
 */
export async function sendOfferReceivedEmail(businessEmail, applicationData, bankName) {
    if (isEmailDisabled) {
        console.log(`📧 Email notifications disabled - skipping offer received email to ${businessEmail}`);
        return { success: true, disabled: true, message: 'Email notifications are currently disabled' };
    }

    try {
        console.log(`📤 Sending offer received notification to ${businessEmail}`);
        
        const response = await emailjs.send(
            process.env.EMAILJS_SERVICE_ID,
            process.env.EMAILJS_OFFER_RECEIVED_TEMPLATE_ID,
            {
                to_email: businessEmail,
                business_name: applicationData.trade_name,
                application_id: applicationData.application_id,
                bank_name: bankName,
                submitted_date: new Date(applicationData.submitted_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                city_of_operation: applicationData.city_of_operation,
                requested_amount: applicationData.requested_financing_amount
            }
        );
        
        console.log(`✅ Offer received email sent to ${businessEmail}. Response:`, response);
        return { success: true, response };
    } catch (error) {
        console.error(`❌ Failed to send offer received email to ${businessEmail}. Error:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Send application status update email to business user
 */
export async function sendApplicationStatusUpdateEmail(businessEmail, applicationData, newStatus, additionalInfo = {}) {
    if (isEmailDisabled) {
        console.log(`📧 Email notifications disabled - skipping status update email to ${businessEmail}`);
        return { success: true, disabled: true, message: 'Email notifications are currently disabled' };
    }

    try {
        console.log(`📤 Sending application status update to ${businessEmail}: ${newStatus}`);
        
        const response = await emailjs.send(
            process.env.EMAILJS_SERVICE_ID,
            process.env.EMAILJS_STATUS_UPDATE_TEMPLATE_ID,
            {
                to_email: businessEmail,
                business_name: applicationData.trade_name,
                application_id: applicationData.application_id,
                current_status: newStatus,
                submitted_date: new Date(applicationData.submitted_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                city_of_operation: applicationData.city_of_operation,
                requested_amount: applicationData.requested_financing_amount,
                additional_info: additionalInfo.message || '',
                next_steps: additionalInfo.nextSteps || ''
            }
        );
        
        console.log(`✅ Status update email sent to ${businessEmail}. Response:`, response);
        return { success: true, response };
    } catch (error) {
        console.error(`❌ Failed to send status update email to ${businessEmail}. Error:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Check if email notifications are currently disabled
 */
export function areEmailNotificationsDisabled() {
    return isEmailDisabled;
}

/**
 * Send newsletter subscription confirmation email
 */
export async function sendNewsletterSubscriptionEmail(userEmail) {
    if (isEmailDisabled) {
        console.log(`📧 Email notifications disabled - skipping newsletter subscription email to ${userEmail}`);
        return { success: true, disabled: true, message: 'Email notifications are currently disabled' };
    }

    try {
        console.log(`📤 Sending newsletter subscription confirmation to ${userEmail}`);
        
        // Use server-side EmailJS
        const emailjs = await import('@emailjs/nodejs');
        
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
 * Send business user registration welcome email
 */
export async function sendBusinessRegistrationEmail(userEmail, businessData) {
    if (isEmailDisabled) {
        console.log(`📧 Email notifications disabled - skipping business registration email to ${userEmail}`);
        return { success: true, disabled: true, message: 'Email notifications are currently disabled' };
    }

    try {
        console.log(`📤 Sending business registration welcome email to ${userEmail}`);
        
        const response = await emailjs.send(
            process.env.EMAILJS_SERVICE_ID,
            process.env.EMAILJS_BUSINESS_REGISTRATION_TEMPLATE_ID,
            {
                user_email: userEmail,
                business_name: businessData.trade_name || businessData.entity_name || 'Business User',
                cr_number: businessData.cr_number || businessData.cr_national_number || 'N/A',
                registration_status: businessData.registration_status || 'active'
            }
        );
        
        console.log(`✅ Business registration email sent to ${userEmail}. Response:`, response);
        return { success: true, response };
    } catch (error) {
        console.error(`❌ Failed to send business registration email to ${userEmail}. Error:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Send auction expiration notification email
 */
export async function sendAuctionExpirationEmail(businessEmail, applicationData, offersCount) {
    if (isEmailDisabled) {
        console.log(`📧 Email notifications disabled - skipping auction expiration email to ${businessEmail}`);
        return { success: true, disabled: true, message: 'Email notifications are currently disabled' };
    }

    try {
        console.log(`📤 Sending auction expiration notification to ${businessEmail}`);
        
        const response = await emailjs.send(
            process.env.EMAILJS_SERVICE_ID,
            process.env.EMAILJS_AUCTION_EXPIRATION_TEMPLATE_ID,
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
                requested_amount: applicationData.requested_financing_amount,
                offers_received: offersCount,
                has_offers: offersCount > 0,
                city_of_operation: applicationData.city_of_operation
            }
        );
        
        console.log(`✅ Auction expiration email sent to ${businessEmail}. Response:`, response);
        return { success: true, response };
    } catch (error) {
        console.error(`❌ Failed to send auction expiration email to ${businessEmail}. Error:`, error);
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
