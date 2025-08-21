# Nesbah Dual-Auction System Implementation

## Overview

This implementation provides a complete dual-auction marketplace system for POS applications with the following key features:

- **48-hour Applications Auction**: Banks compete to purchase and offer on business applications
- **24-hour Offers Auction**: Business users select their preferred bank offer
- **Revenue Collection**: 25 SAR per lead purchase
- **Automated Status Transitions**: Cron jobs handle auction expiration and offer selection deadlines
- **Real-time Tracking**: Live countdown timers and status updates

## Database Schema Changes

### New Tables
- `application_revenue`: Tracks 25 SAR payments from banks
- `offer_selections`: Records business user offer selections

### Updated Tables
- `submitted_applications`: Added auction timing and revenue tracking
- `pos_application`: Added auction timing fields
- `application_offers`: Added status tracking and selection deadlines

## Status Workflow

### Application Status Flow
```
submitted → pending_offers → purchased → offer_received → completed
         ↓                 ↓           ↓                ↓
      abandoned         abandoned   abandoned      deal_expired
```

### Offer Status Flow
```
submitted → deal_won
         → deal_lost
```

### Status Descriptions
- **submitted**: Application submitted and under review
- **pending_offers**: Live auction active (48-hour window for banks to purchase)
- **purchased**: Bank has purchased access to business data (25 SAR payment)
- **offer_received**: Bank has submitted an offer (24-hour window for business selection)
- **completed**: Business has selected an offer, deal finalized
- **abandoned**: No banks purchased the application during auction
- **deal_expired**: Business did not select an offer within time limit

## Key Components

### 1. Database Migration (`src/lib/db-migration.js`)
- Updates existing tables with new fields
- Migrates existing data to new status workflow
- Creates new tables for revenue and offer tracking

### 2. Status Transitions (`src/lib/cron/statusTransitions.js`)
- Automated handling of auction expiration
- Manages 24-hour offer selection windows
- Updates application and offer statuses

### 3. Offer Selection (`src/components/OfferSelection.jsx`)
- Business user interface for viewing and selecting offers
- Real-time countdown timer
- Offer comparison and selection functionality

### 4. API Endpoints

#### `/api/offers/[application_id]` (GET)
- Fetches all offers for a business user's application
- Includes offer details, bank information, and deadlines

#### `/api/offers/[application_id]` (POST)
- Business user selects preferred offer
- Updates offer statuses and application completion

## Revenue Model

- **25 SAR per lead purchase**: Collected immediately when bank purchases access
- **Multiple purchases possible**: Multiple banks can purchase the same application
- **Revenue tracking**: Stored in `application_revenue` table
- **Dashboard display**: Shows total revenue in bank portal

## Setup Instructions

### 1. Run Database Migration
```bash
npm run migrate
```

### 2. Set Up Cron Jobs
Add the following cron jobs to your server:

```bash
# Run status transitions every 5 minutes
*/5 * * * * cd /path/to/project && npm run status-transitions

# Run status transitions every hour for cleanup
0 * * * * cd /path/to/project && npm run status-transitions
```

### 3. Environment Variables
Ensure your database connection is properly configured in `src/lib/db.js`

## Usage Workflow

### For Business Users
1. Submit POS application → Status: `pending_offers`
2. Wait for 48-hour auction period
3. If offers received → Status: `offer_received`
4. Select preferred offer within 24 hours → Status: `completed`
5. If no selection made → Status: `deal_expired`

### For Bank Users
1. View available applications in "Open Applications"
2. Purchase lead access (25 SAR) → Gain contact information
3. Submit competitive offer
4. Wait for business user selection
5. Receive notification of win/loss

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/posApplication` | POST | Submit new application |
| `/api/leads` | GET | Get available leads for banks |
| `/api/leads/[id]/purchased_applications` | POST | Purchase lead and submit offer |
| `/api/offers/[application_id]` | GET | Get offers for business user |
| `/api/offers/[application_id]` | POST | Select preferred offer |
| `/api/leads/stats` | GET | Get bank dashboard statistics |

## Monitoring and Maintenance

### Status Monitoring
- Check application status distribution
- Monitor offer selection rates
- Track revenue collection

### Automated Cleanup
- Expired auctions automatically marked as `abandoned`
- Expired offer selections marked as `deal_expired`
- All offers updated to appropriate status

### Performance Considerations
- Indexes on `auction_end_time` and `offer_selection_end_time`
- Regular cleanup of expired records
- Monitor database performance during peak usage

## Troubleshooting

### Common Issues
1. **Migration fails**: Check database permissions and connection
2. **Status transitions not working**: Verify cron job setup
3. **Offers not showing**: Check application status and timing
4. **Revenue not tracking**: Verify `application_revenue` table exists

### Debug Commands
```bash
# Check migration status
npm run migrate

# Run status transitions manually
npm run status-transitions

# Check database tables
psql -d your_database -c "\dt"
```

## Future Enhancements

1. **Email Notifications**: Automated emails for status changes
2. **Analytics Dashboard**: Detailed performance metrics
3. **Payment Integration**: Automated payment processing
4. **Mobile App**: Native mobile application
5. **Advanced Filtering**: Industry, amount, location filters

## Support

For technical support or questions about the dual-auction system, please refer to the main project documentation or contact the development team.


You're absolutely right! The application should stay in 'pending_offers' (live auction) status until the auction period ends, regardless of whether offers are submitted. Only when the auction ends should we check for offers and transition to 'offer_received' if offers exist, or 'abandoned' if no offers.

Let me fix the status transitions logic:

Now let me also update the event-driven monitoring to reflect this change:

Now let me update the Offer Management component to better reflect this workflow:

Now let me add the auction time remaining to the table display:

Now let me also add auction time information to the view modal:

Perfect! Now let me create a summary of the corrected workflow:

## 🎯 **Corrected Live Auction Workflow**

### **1. Key Changes Made**

#### **Status Transitions Fixed**
- **Before**: Applications moved to 'offer_received' when offers were submitted
- **After**: Applications stay in 'pending_offers' until auction ends (48 hours)

#### **Auction Logic**
- **Live Auction Period**: 48 hours from application submission
- **Multiple Purchases**: Banks can purchase throughout the auction period
- **Status Change**: Only when auction ends, check for offers and transition accordingly

### **2. Corrected Workflow**

```
Application Submitted → Status: pending_offers (Live Auction - 48 hours)
           ↓
    Bank A purchases → purchased_by: [BankA], revenue: +25 SAR
           ↓
    Bank B purchases → purchased_by: [BankA, BankB], revenue: +50 SAR
           ↓
    Bank C submits offer → offers_count: 1, status: still pending_offers
           ↓
    Auction Ends (48 hours) → Check for offers
           ↓
    If offers exist → Status: offer_received (24-hour selection window)
    If no offers → Status: abandoned
```

### **3. Updated Components**

#### **Offer Management Interface**
- **New Column**: "Auction Ends" showing time remaining
- **Status Display**: "Live Auction (2 purchased)" with time remaining
- **Auction Timer**: Real-time countdown showing hours and minutes remaining
- **Purchase Tracking**: Shows which banks purchased during auction

#### **Status Transitions**
- **Auction Expiration**: Only trigger status changes when auction ends
- **Offer Check**: Count offers when auction ends, not when submitted
- **Proper Transitions**: 
  - `pending_offers` → `offer_received` (if offers exist)
  - `pending_offers` → `abandoned` (if no offers)

### **4. Benefits**

✅ **Proper Auction Timing**: Applications stay in auction for full 48 hours
✅ **Multiple Purchases**: Banks can purchase throughout auction period
✅ **Offer Flexibility**: Banks can submit offers anytime during auction
✅ **Clear Deadlines**: Auction end time clearly displayed
✅ **Revenue Maximization**: Multiple banks can purchase same application

### **5. Timeline Example**

```
Day 1, 10:00 AM: Application submitted → pending_offers
Day 1, 2:00 PM: Bank A purchases → +25 SAR
Day 1, 4:00 PM: Bank B purchases → +25 SAR  
Day 1, 6:00 PM: Bank A submits offer → offers_count: 1
Day 2, 8:00 AM: Bank C purchases → +25 SAR
Day 2, 10:00 AM: Bank B submits offer → offers_count: 2
Day 3, 10:00 AM: Auction ends → Status: offer_received (2 offers)
Day 4, 10:00 AM: Selection period ends → Status: completed/expired
```

### **6. Status Rules**

- **During Auction**: All applications stay in `pending_offers` status
- **Purchases**: Tracked in `purchased_by` array, revenue added
- **Offers**: Can be submitted anytime during auction
- **Auction End**: Only time status can change from `pending_offers`
- **After Auction**: Based on offers existence → `offer_received` or `abandoned`

This corrected workflow ensures that the live auction operates properly with a fixed 48-hour window, allowing maximum participation and revenue generation! 🎉