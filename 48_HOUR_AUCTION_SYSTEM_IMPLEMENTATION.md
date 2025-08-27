# 48-Hour Auction System Implementation

## Overview

This document describes the implementation of the 48-hour auction system and approved leads tracking for banks. The system ensures that all applications have a `live_auction` status for exactly 48 hours after submission, after which they automatically transition based on whether they received offers.

## System Requirements

### 1. Application Status Workflow

**New applications start with `live_auction` status for 48 hours:**

```
Application Submission → live_auction (48 hours) → approved_leads/ignored
```

**Status Definitions:**
- `live_auction`: Application is in active auction phase (48 hours from submission)
- `approved_leads`: Application received at least one offer within the 48-hour period
- `complete`: Application has been successfully processed (manual admin action)
- `ignored`: No offers received within the 48-hour period

### 2. Approved Leads Tracking

**Each bank maintains an approved_leads list:**
- Tracks all leads purchased by the bank
- Not a status, but a record of bank purchases
- Includes offer details and purchase timestamps
- Allows banks to view their purchase history

## Implementation Details

### Database Changes

#### 1. New `approved_leads` Table

```sql
CREATE TABLE approved_leads (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES pos_application(application_id) ON DELETE CASCADE,
    bank_user_id INTEGER REFERENCES bank_users(user_id) ON DELETE CASCADE,
    purchased_at TIMESTAMP DEFAULT NOW(),
    offer_submitted_at TIMESTAMP,
    offer_device_setup_fee DECIMAL(10,2),
    offer_transaction_fee_mada DECIMAL(5,2),
    offer_transaction_fee_visa_mc DECIMAL(5,2),
    offer_settlement_time_mada INTEGER,
    offer_comment TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(application_id, bank_user_id)
);
```

#### 2. Updated Status Constraints

```sql
-- submitted_applications table
ALTER TABLE submitted_applications 
ADD CONSTRAINT submitted_applications_status_check 
CHECK (status IN ('live_auction', 'approved_leads', 'complete', 'ignored'));

-- pos_application table
ALTER TABLE pos_application 
ADD CONSTRAINT pos_application_status_check 
CHECK (status IN ('live_auction', 'approved_leads', 'complete', 'ignored'));
```

#### 3. Performance Indexes

```sql
CREATE INDEX idx_submitted_applications_status_auction_end 
ON submitted_applications(status, auction_end_time);

CREATE INDEX idx_approved_leads_application_bank 
ON approved_leads(application_id, bank_user_id);

CREATE INDEX idx_approved_leads_purchased_at 
ON approved_leads(purchased_at);
```

### Application Submission Changes

#### Updated `src/app/api/posApplication/route.jsx`

- Applications now start with `live_auction` status
- `auction_end_time` is set to 48 hours from submission
- Both `pos_application` and `submitted_applications` tables are updated

### Bank Purchase Process

#### Updated `src/app/api/leads/[id]/purchased_applications/route.jsx`

When a bank purchases a lead:
1. Record is added to `approved_leads` table
2. `offers_count` is incremented in `submitted_applications`
3. Revenue is tracked (25 SAR per purchase)
4. Application remains in `live_auction` status until 48-hour period ends

### Automatic Status Transitions

#### Auction Status Monitor (`src/lib/cron/auction-status-monitor.js`)

**Runs every 5 minutes to check for expired auctions:**

1. **Find expired applications:**
   ```sql
   SELECT * FROM submitted_applications 
   WHERE status = 'live_auction' 
   AND auction_end_time <= NOW()
   ```

2. **Transition logic:**
   - If `offers_count > 0`: Transition to `approved_leads`
   - If `offers_count = 0`: Transition to `ignored`

3. **Update all related tables:**
   - `submitted_applications.status`
   - `pos_application.status`
   - `application_offer_tracking.current_application_status`

4. **Log transitions:**
   - Record in `status_audit_log` table
   - Send notifications to business users

### Admin Interface

#### New API Endpoint: `/api/admin/banks/approved-leads`

**Features:**
- List all approved leads with pagination
- Filter by bank and status
- Summary statistics
- Detailed lead information

#### New Component: `ApprovedLeadsTable.jsx`

**Features:**
- Display approved leads in admin panel
- Statistics cards showing key metrics
- Filtering and pagination
- Status indicators and formatting

## Usage Instructions

### 1. Run Database Migration

```bash
node scripts/implement-48-hour-auction-system.js
```

This script will:
- Create the `approved_leads` table
- Update existing applications to `live_auction` status
- Set auction end times for all applications
- Create necessary indexes and constraints
- Test the system

### 2. Start Auction Monitor

```bash
node scripts/start-auction-monitor.js
```

This will start the background process that:
- Checks for expired auctions every 5 minutes
- Automatically transitions application statuses
- Generates urgency alerts for expiring auctions
- Logs all transitions

### 3. Monitor Approved Leads

Access the admin panel to view:
- Total approved leads by bank
- Purchase statistics and metrics
- Individual lead details
- Performance analytics

## Business Logic Flow

### Application Lifecycle

1. **Submission:** Business user submits application
   - Status: `live_auction`
   - Auction end time: 48 hours from submission

2. **Auction Period:** Banks can view and purchase leads
   - Banks purchase leads (25 SAR each)
   - Records added to `approved_leads` table
   - `offers_count` incremented

3. **Auction End:** 48 hours after submission
   - **With offers:** Status → `approved_leads`
   - **No offers:** Status → `ignored`

4. **Completion:** Admin manually marks as `complete`
   - Final status for successful deals

### Bank Purchase Tracking

- Each bank maintains their own `approved_leads` list
- Tracks purchase date, offer details, and status
- Provides purchase history and analytics
- Enables performance monitoring

## Monitoring and Alerts

### System Alerts

The auction monitor creates alerts for:
- Applications approaching auction end without offers
- Failed status transitions
- System errors or anomalies

### Performance Metrics

Track key metrics:
- Average time to purchase
- Conversion rates
- Bank performance
- Revenue generation

## Error Handling

### Database Constraints

- Unique constraint prevents duplicate purchases
- Foreign key constraints maintain data integrity
- Status constraints ensure valid transitions

### Transaction Safety

- All status transitions use database transactions
- Rollback on errors prevents data inconsistency
- Comprehensive error logging

### Monitoring

- Background job monitoring
- Error alerting
- Performance tracking
- Audit logging

## Future Enhancements

### Potential Improvements

1. **Email Notifications:**
   - Notify business users when auction ends
   - Alert banks about expiring auctions
   - Send purchase confirmations

2. **Advanced Analytics:**
   - Bank performance dashboards
   - Conversion rate analysis
   - Revenue forecasting

3. **Automation:**
   - Auto-completion for successful deals
   - Smart offer matching
   - Predictive analytics

4. **Integration:**
   - CRM system integration
   - Payment processing
   - Document management

## Troubleshooting

### Common Issues

1. **Status Not Transitioning:**
   - Check auction end times
   - Verify monitor is running
   - Check database constraints

2. **Duplicate Purchases:**
   - Unique constraint prevents this
   - Check application logic

3. **Performance Issues:**
   - Monitor database indexes
   - Check query performance
   - Optimize background jobs

### Debug Commands

```bash
# Check current status distribution
SELECT status, COUNT(*) FROM submitted_applications GROUP BY status;

# Check expired auctions
SELECT * FROM submitted_applications 
WHERE status = 'live_auction' AND auction_end_time <= NOW();

# Check approved leads
SELECT bu.entity_name, COUNT(*) 
FROM approved_leads al 
JOIN bank_users bu ON al.bank_user_id = bu.user_id 
GROUP BY bu.entity_name;
```

## Conclusion

The 48-hour auction system provides a structured, automated workflow for managing application lifecycles while maintaining comprehensive tracking of bank purchases. The system ensures fair auction periods, automatic status transitions, and detailed analytics for business intelligence.
