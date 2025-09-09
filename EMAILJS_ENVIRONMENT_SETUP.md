# EmailJS Environment Variables Setup

## Required Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# EmailJS Configuration
EMAILJS_SERVICE_ID=service_mykz9r4
EMAILJS_PUBLIC_KEY=1Ivllk-5mFxZxATpz
EMAILJS_PRIVATE_KEY=267xl81NNi-ekrb-BrYh7

# EmailJS Template IDs (create these templates in EmailJS dashboard)
EMAILJS_NEWSLETTER_SUBSCRIPTION_TEMPLATE_ID=newsletter_subscription_confirmation
EMAILJS_BUSINESS_REGISTRATION_TEMPLATE_ID=business_user_registration_welcome
EMAILJS_APPLICATION_SUBMITTED_TEMPLATE_ID=application_submission_confirmation
EMAILJS_AUCTION_EXPIRATION_TEMPLATE_ID=auction_window_expiration
EMAILJS_NEW_APPLICATION_LEAD_TEMPLATE_ID=new_application_lead_bank

# Additional existing template IDs (if already configured)
EMAILJS_APPLICATION_SUBMITTED_TEMPLATE_ID=template_application_submitted
EMAILJS_AUCTION_SUCCESS_TEMPLATE_ID=template_auction_success
EMAILJS_AUCTION_NO_OFFERS_TEMPLATE_ID=template_auction_no_offers
EMAILJS_OFFER_RECEIVED_TEMPLATE_ID=template_offer_received
EMAILJS_STATUS_UPDATE_TEMPLATE_ID=template_status_update
EMAILJS_NEW_LEAD_TEMPLATE_ID=template_new_lead

# Email Notification Control
DISABLE_EMAIL_NOTIFICATIONS=false
```

## EmailJS Dashboard Setup Instructions

### 1. Create Email Templates

In your EmailJS dashboard, create the following templates:

#### Template 1: Newsletter Subscription Confirmation
- **Template ID:** `newsletter_subscription_confirmation`
- **Subject:** `Welcome to Nesbah Newsletter - Stay Updated on Financing Opportunities`
- **Content:** Copy the HTML from `EMAIL_TEMPLATES.md` Template 1

#### Template 2: Business User Registration Welcome
- **Template ID:** `business_user_registration_welcome`
- **Subject:** `Welcome to Nesbah - Your Business Financing Journey Starts Here`
- **Content:** Copy the HTML from `EMAIL_TEMPLATES.md` Template 2

#### Template 3: Application Submission Confirmation
- **Template ID:** `application_submission_confirmation`
- **Subject:** `Application Submitted Successfully - Your Auction is Live!`
- **Content:** Copy the HTML from `EMAIL_TEMPLATES.md` Template 3

#### Template 4: Auction Window Expiration Notification
- **Template ID:** `auction_window_expiration`
- **Subject:** `Auction Results Available - Check Your Offers Now!`
- **Content:** Copy the HTML from `EMAIL_TEMPLATES.md` Template 4

#### Template 5: New Application Lead for Bank Users
- **Template ID:** `new_application_lead_bank`
- **Subject:** `New POS Financing Application Available - {{business_name}} ({{application_id}})`
- **Content:** Copy the HTML from `EMAIL_TEMPLATES.md` Template 5

### 2. Configure Template Variables

For each template, ensure these variables are configured in EmailJS:

#### Newsletter Subscription Template Variables:
- `{{user_email}}`

#### Business Registration Template Variables:
- `{{user_email}}`
- `{{business_name}}`
- `{{cr_number}}`
- `{{registration_status}}`

#### Application Submission Template Variables:
- `{{business_name}}`
- `{{application_id}}`
- `{{submitted_date}}`
- `{{auction_end_date}}`
- `{{city_of_operation}}`
- `{{number_of_pos_devices}}`
- `{{requested_amount}}`
- `{{repayment_period}}`

#### Auction Expiration Template Variables:
- `{{business_name}}`
- `{{application_id}}`
- `{{submitted_date}}`
- `{{auction_end_date}}`
- `{{requested_amount}}`
- `{{offers_received}}`
- `{{has_offers}}`
- `{{city_of_operation}}`

#### New Application Lead Template Variables:
- `{{to_email}}`
- `{{business_name}}`
- `{{application_id}}`
- `{{city_of_operation}}`
- `{{number_of_pos_devices}}`
- `{{requested_amount}}`
- `{{repayment_period}}`
- `{{auction_end_date}}`
- `{{business_cr_number}}`
- `{{business_city}}`
- `{{business_legal_form}}`

### 3. Test Templates

1. Use EmailJS test feature to verify templates render correctly
2. Test with sample data to ensure all variables are populated
3. Check email rendering across different email clients
4. Verify that all links and styling work properly

### 4. Production Setup

1. Update environment variables in your production environment
2. Ensure EmailJS service is properly configured
3. Test email delivery in production environment
4. Monitor email delivery rates and bounce rates

## Email Notification Features

### 1. Newsletter Subscription
- **Trigger:** When user subscribes to newsletter via homepage or footer
- **Recipient:** Subscriber's email address
- **Content:** Welcome message with platform information and benefits

### 2. Business User Registration
- **Trigger:** When business user successfully registers
- **Recipient:** Business user's email address
- **Content:** Welcome message with business details and next steps

### 3. Application Submission
- **Trigger:** When business user submits POS financing application
- **Recipient:** Business user's email address
- **Content:** Confirmation with application details and auction timeline

### 4. Auction Window Expiration
- **Trigger:** When 48-hour auction period ends
- **Recipient:** Business user's email address
- **Content:** Results notification with offer count and next steps

### 5. New Application Lead for Banks
- **Trigger:** When business user submits POS financing application
- **Recipient:** All active bank users' email addresses
- **Content:** Lead notification with business details and financing requirements

## Testing Email Notifications

### Manual Testing
1. Subscribe to newsletter and check for confirmation email
2. Register a new business user and verify welcome email
3. Submit a test application and confirm submission email
4. Check that bank users receive new application lead notifications
5. Wait for auction expiration and check results email

### Automated Testing
- Email notifications are disabled when `DISABLE_EMAIL_NOTIFICATIONS=true`
- All email functions return success status even when disabled
- Error handling prevents application failures due to email issues

## Troubleshooting

### Common Issues
1. **Templates not rendering:** Check variable names match exactly
2. **Emails not sending:** Verify EmailJS service configuration
3. **Missing variables:** Ensure all required variables are passed
4. **Styling issues:** Test HTML rendering in different email clients

### Debug Mode
- Check console logs for email sending status
- Monitor EmailJS dashboard for delivery statistics
- Use EmailJS test feature to verify template rendering

## Security Notes

- Never expose private keys in client-side code
- Use environment variables for all sensitive configuration
- Regularly rotate EmailJS keys for security
- Monitor email delivery for suspicious activity
