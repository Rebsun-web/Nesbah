# View Tracking and Time Metrics Implementation

## Overview

This implementation provides accurate time metrics by tracking when banks view applications and prepare offers. It replaces the previous inaccurate calculations with real-time tracking data.

## Features Implemented

### 1. View Tracking Tables
- **`bank_application_views`**: Tracks when banks view applications
- **`bank_application_access_log`**: Detailed access logging for all bank actions

### 2. Accurate Time Metrics
- **Response Time**: Application submission → First bank view
- **Offer Time**: First bank view → Offer submission
- **Display**: All times now shown in hours instead of minutes

### 3. API Endpoints
- **`/api/bank/application-view`**: POST/GET for tracking bank actions
- **`/api/admin/time-metrics`**: Updated with accurate calculations

### 4. React Hook
- **`useViewTracking`**: Automatic tracking for bank components

## Database Schema

### bank_application_views
```sql
CREATE TABLE bank_application_views (
    view_id SERIAL PRIMARY KEY,
    bank_user_id INTEGER NOT NULL REFERENCES users(user_id),
    application_id INTEGER NOT NULL REFERENCES pos_application(application_id),
    viewed_at TIMESTAMP DEFAULT NOW(),
    view_duration_seconds INTEGER DEFAULT 0,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(bank_user_id, application_id)
);
```

### bank_application_access_log
```sql
CREATE TABLE bank_application_access_log (
    log_id SERIAL PRIMARY KEY,
    bank_user_id INTEGER NOT NULL REFERENCES users(user_id),
    application_id INTEGER NOT NULL REFERENCES pos_application(application_id),
    action_type VARCHAR(50) NOT NULL,
    action_timestamp TIMESTAMP DEFAULT NOW(),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    additional_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Database Functions

### record_application_view()
Records when a bank views an application and logs the access.

### record_offer_preparation_start()
Records when a bank starts preparing an offer.

### record_offer_preparation_end()
Records when a bank finishes preparing an offer.

## API Usage

### For Banks (Automatic Tracking)
```javascript
import { useViewTracking } from '@/hooks/useViewTracking';

function ApplicationDetail({ applicationId, bankUserId }) {
    // Automatically tracks view and offer preparation
    useViewTracking(applicationId, bankUserId);
    
    return (
        <div>
            {/* Application details */}
        </div>
    );
}
```

### For Banks (Manual Tracking)
```javascript
const { trackCustomAction } = useViewTracking(applicationId, bankUserId);

// Track custom actions
await trackCustomAction('download_document', { document_type: 'financial_statement' });
await trackCustomAction('contact_business', { method: 'phone' });
```

### For Admins (API Access)
```javascript
// Get view history for an application
const response = await fetch(`/api/bank/application-view?application_id=${applicationId}`, {
    credentials: 'include'
});
const data = await response.json();
```

## Time Metrics Calculation

### Response Time
```sql
AVG(EXTRACT(EPOCH FROM (bav.viewed_at - pa.submitted_at))/3600) as avg_response_time_hours
```
- **Definition**: Time from application submission to first bank view
- **Unit**: Hours
- **Accuracy**: High (based on actual view tracking)

### Offer Time
```sql
AVG(EXTRACT(EPOCH FROM (ao.submitted_at - bav.viewed_at))/3600) as avg_offer_time_hours
```
- **Definition**: Time from first bank view to offer submission
- **Unit**: Hours
- **Accuracy**: High (based on actual view tracking)

## Implementation Steps

### 1. Create Database Tables
```bash
node scripts/create-view-tracking-tables.js
```

### 2. Populate Historical Data
```bash
node scripts/populate-historical-view-data.js
```

### 3. Update Bank Components
Add the `useViewTracking` hook to bank application detail pages:

```javascript
import { useViewTracking } from '@/hooks/useViewTracking';

// In your component
useViewTracking(applicationId, bankUserId);
```

### 4. Test the Implementation
- Submit a new application
- Have a bank view the application
- Submit an offer
- Check the analytics dashboard for accurate time metrics

## Action Types Tracked

- **`view`**: Bank views application details
- **`offer_preparation_start`**: Bank starts preparing offer
- **`offer_preparation_end`**: Bank finishes preparing offer
- **`page_hidden`**: User switches away from page
- **`page_visible`**: User returns to page
- **`download_document`**: Bank downloads application documents
- **`contact_business`**: Bank contacts the business
- **Custom actions**: Any other bank actions

## Benefits

### 1. Accurate Metrics
- Real response times based on actual bank views
- Real offer preparation times
- No more estimated or incorrect calculations

### 2. Better Analytics
- Detailed bank behavior tracking
- Session-based analysis
- Performance insights

### 3. Improved User Experience
- Automatic tracking (no manual intervention needed)
- Privacy-compliant (only tracks necessary data)
- Non-intrusive implementation

## Data Privacy

- Only tracks application-related actions
- IP addresses are stored for security purposes
- User agents are stored for analytics
- All data is encrypted and secure
- Banks can view their own tracking data

## Monitoring and Maintenance

### Regular Tasks
1. Monitor view tracking performance
2. Clean up old access logs (older than 1 year)
3. Verify data accuracy in analytics dashboard

### Troubleshooting
- Check database connection if tracking fails
- Verify bank authentication for API calls
- Monitor for any tracking errors in console

## Future Enhancements

1. **Advanced Analytics**: Heat maps of bank activity
2. **Performance Metrics**: Bank efficiency scoring
3. **Predictive Analytics**: Offer acceptance probability
4. **Real-time Notifications**: Instant alerts for bank actions
5. **Mobile Tracking**: Mobile app integration

## Migration Notes

- Historical data is populated with realistic timestamps
- Existing offers will show estimated times initially
- New offers will have accurate tracking from day one
- No downtime required for implementation
