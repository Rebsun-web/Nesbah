# Email Notification System

## Overview

The Nesbah platform now includes a comprehensive email notification system that automatically notifies business users and banks about important application events. The system uses EmailJS for reliable email delivery and includes background processing for auction completion notifications.

## Features

### 1. Business User Notifications

- **Application Submission Confirmation**: Sent immediately when a POS application is submitted
- **Auction Completion Notification**: Sent when the 48-hour auction period ends
  - Success notification if offers were received
  - No offers notification if no banks submitted offers
- **Offer Received Notification**: Sent when a bank submits an offer
- **Status Update Notifications**: Sent for important status changes

### 2. Bank Notifications

- **New Application Alerts**: Sent to all active bank users when a new application is submitted
- **Lead Information**: Includes business details, financing requirements, and auction timeline

## Email Templates Required

The system requires the following EmailJS templates to be configured:

### Business User Templates

1. **Application Submitted** (`EMAILJS_APPLICATION_SUBMITTED_TEMPLATE_ID`)
   - Confirms application submission
   - Shows auction end time (48 hours from submission)
   - Includes application details

2. **Auction Success** (`EMAILJS_AUCTION_SUCCESS_TEMPLATE_ID`)
   - Sent when auction ends with offers
   - Congratulates business on receiving offers
   - Provides next steps

3. **Auction No Offers** (`EMAILJS_AUCTION_NO_OFFERS_TEMPLATE_ID`)
   - Sent when auction ends without offers
   - Explains the situation
   - Suggests next steps

4. **Offer Received** (`EMAILJS_OFFER_RECEIVED_TEMPLATE_ID`)
   - Sent when a bank submits an offer
   - Shows bank name and application details

5. **Status Update** (`EMAILJS_STATUS_UPDATE_TEMPLATE_ID`)
   - General status change notifications
   - Includes current status and next steps

### Bank User Templates

1. **New Lead** (`EMAILJS_NEW_LEAD_TEMPLATE_ID`)
   - New application notification
   - Business details and financing requirements
   - Auction timeline information

## Environment Variables

Add these to your `.env` file:

```bash
# EmailJS Configuration
EMAILJS_PUBLIC_KEY=your_public_key
EMAILJS_PRIVATE_KEY=your_private_key
EMAILJS_SERVICE_ID=your_service_id

# Email Template IDs
EMAILJS_APPLICATION_SUBMITTED_TEMPLATE_ID=template_id_1
EMAILJS_AUCTION_SUCCESS_TEMPLATE_ID=template_id_2
EMAILJS_AUCTION_NO_OFFERS_TEMPLATE_ID=template_id_3
EMAILJS_OFFER_RECEIVED_TEMPLATE_ID=template_id_4
EMAILJS_STATUS_UPDATE_TEMPLATE_ID=template_id_5
EMAILJS_NEW_LEAD_TEMPLATE_ID=template_id_6
```

## Database Changes

Run the SQL migration script to add notification tracking:

```bash
psql -d your_database -f scripts/add-notification-tracking.sql
```

This adds:
- `auction_completion_notification_sent` column to track sent notifications
- Performance indexes for notification queries
- Prevents duplicate notifications for old applications

## API Endpoints

### 1. Application Submission
- **POST** `/api/posApplication`
- Automatically sends:
  - Confirmation email to business user
  - Notification emails to all active bank users

### 2. Auction Completion Notifications
- **POST** `/api/applications/auction-completion`
- **GET** `/api/applications/auction-completion`
- Manually trigger auction completion notifications

### 3. Admin Control
- **POST** `/api/admin/auction-notifications`
- **GET** `/api/admin/auction-notifications`
- Start/stop/status of the background notification handler

## Background Processing

### Auction Notification Handler

The system includes an automated background task that:

- Runs every 5 minutes
- Checks for expired auctions needing notifications
- Sends completion emails automatically
- Tracks notification status to prevent duplicates
- Includes rate limiting (1 second delay between emails)

### Starting the Handler

```javascript
import auctionNotificationHandler from '@/lib/auction-notification-handler';

// Start the handler
auctionNotificationHandler.start();

// Check status
const status = auctionNotificationHandler.getStatus();

// Stop the handler
auctionNotificationHandler.stop();
```

### Admin Control

Admins can control the notification handler via the admin API:

```bash
# Start notifications
curl -X POST /api/admin/auction-notifications \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'

# Check status
curl -X GET /api/admin/auction-notifications

# Stop notifications
curl -X POST /api/admin/auction-notifications \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'
```

## Email Content Examples

### Application Submission Confirmation

```
Subject: Your POS Financing Application Has Been Submitted

Dear [Business Name],

Your POS financing application has been successfully submitted to Nesbah platform.

Application Details:
- Application ID: [ID]
- Submitted: [Date/Time]
- Auction Ends: [End Date/Time]
- City: [City]
- POS Devices: [Number]
- Requested Amount: [Amount]
- Repayment Period: [Months]

Your application is now in the live auction phase. Banks will review your request and submit competitive offers over the next 48 hours.

You will receive an email notification when the auction ends.

Best regards,
The Nesbah Team
```

### New Lead Notification (Banks)

```
Subject: New POS Financing Lead Available

Dear Bank Team,

A new POS financing application has been submitted and is now available for review.

Business Details:
- Business Name: [Name]
- CR Number: [CR Number]
- City: [City]
- Legal Form: [Form]

Financing Requirements:
- POS Devices: [Number]
- Requested Amount: [Amount]
- Repayment Period: [Months]
- City of Operation: [City]

Auction Timeline:
- Auction Ends: [End Date/Time]
- Current Status: Live Auction

This lead is available for the next [X] hours. Submit your competitive offer to win this business.

Best regards,
The Nesbah Team
```

## Error Handling

The system includes comprehensive error handling:

- **Email failures don't break application submission**
- **Retry logic for failed notifications**
- **Detailed logging for debugging**
- **Graceful degradation when email services are unavailable**

## Monitoring and Logging

### Console Logs

The system provides detailed logging:

```
📤 Sending application submission confirmation to business@example.com
✅ Application submission confirmation sent to business@example.com
📤 Sending new application notifications to 5 banks
✅ New application notification sent to bank1@example.com
✅ New application notification sent to bank2@example.com
📊 Bank notification results: 5 successful, 0 failed
```

### Performance Metrics

Track notification performance:

- Success/failure rates
- Processing times
- Queue lengths
- Email delivery status

## Testing

### Test Email Templates

1. Create test EmailJS templates
2. Use test email addresses
3. Verify template variables are populated correctly
4. Test all notification scenarios

### Manual Testing

```javascript
// Test application submission
const response = await fetch('/api/posApplication', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testApplicationData)
});

// Test auction completion notification
const notificationResponse = await fetch('/api/applications/auction-completion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ application_id: 'test_id' })
});
```

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check EmailJS credentials
   - Verify template IDs
   - Check email service status

2. **Duplicate notifications**
   - Verify notification tracking column exists
   - Check background handler status
   - Review application status transitions

3. **Performance issues**
   - Monitor database query performance
   - Check email rate limiting
   - Review background task intervals

### Debug Commands

```bash
# Check notification handler status
curl -X GET /api/admin/auction-notifications

# View pending notifications
curl -X GET /api/applications/auction-completion

# Check database notification tracking
psql -d your_database -c "
SELECT 
    application_id, 
    status, 
    auction_completion_notification_sent,
    auction_end_time
FROM pos_application 
WHERE status IN ('completed', 'ignored')
ORDER BY auction_end_time DESC
LIMIT 10;
"
```

## Future Enhancements

- **SMS notifications** for critical updates
- **Push notifications** in the web app
- **Email preferences** for users
- **Notification scheduling** for different time zones
- **Advanced analytics** for notification effectiveness
- **Template customization** per bank/business
- **Bulk notification processing** for system updates

## Support

For technical support with the email notification system:

1. Check the console logs for error messages
2. Verify EmailJS configuration
3. Test individual notification functions
4. Review database notification tracking
5. Contact the development team with specific error details
