# Deployment Checklist for View Tracking & Time Metrics

## Pre-Deployment Setup

### 1. Database Setup
- [ ] **Create View Tracking Tables**
  ```bash
  node scripts/create-view-tracking-tables.js
  ```
  - Creates `bank_application_views` table
  - Creates `bank_application_access_log` table
  - Creates database functions for tracking

- [ ] **Populate Historical Data**
  ```bash
  node scripts/populate-historical-view-data.js
  ```
  - Adds realistic view tracking data for existing offers
  - Ensures analytics show accurate metrics from day one

### 2. Environment Configuration
- [ ] **Database Connection**
  - Verify `DATABASE_URL` is set correctly
  - Test database connectivity
  - Ensure proper permissions for new tables

- [ ] **API Endpoints**
  - Verify `/api/bank/application-view` is accessible
  - Test authentication for bank users
  - Check CORS settings if needed

## Code Implementation Status

### ✅ Completed
- [x] **View Tracking Hook** (`useViewTracking`)
- [x] **API Endpoints** for tracking bank actions
- [x] **Time Metrics API** updated with accurate calculations
- [x] **Enhanced Analytics Component** updated to show hours
- [x] **Bank Application Pages** integrated with view tracking
- [x] **Test Component** for verifying functionality

### 🔄 In Progress
- [ ] **Production Testing** of view tracking
- [ ] **Performance Optimization** of tracking queries
- [ ] **Error Handling** improvements

## Deployment Steps

### 1. Database Migration
```bash
# Run these commands in order
node scripts/create-view-tracking-tables.js
node scripts/populate-historical-view-data.js
```

### 2. Code Deployment
- [ ] Deploy updated code to production
- [ ] Verify all new files are included:
  - `src/hooks/useViewTracking.js`
  - `src/app/api/bank/application-view/route.jsx`
  - Updated `src/app/api/admin/time-metrics/route.jsx`
  - Updated `src/components/admin/EnhancedAnalytics.jsx`
  - Updated bank application pages

### 3. Post-Deployment Verification

#### Test View Tracking
1. **Login as a bank user**
2. **Navigate to an application detail page**
3. **Check browser console** for tracking logs
4. **Use the test panel** to verify functionality
5. **Submit an offer** to test complete flow

#### Test Analytics Dashboard
1. **Login as admin user**
2. **Navigate to analytics dashboard**
3. **Verify time metrics** show in hours
4. **Check bank performance table** for accurate data
5. **Verify conversion rates** are calculated correctly

#### Test API Endpoints
```bash
# Test view tracking API
curl -X POST http://your-domain/api/bank/application-view \
  -H "Content-Type: application/json" \
  -d '{"application_id": 1, "action_type": "view"}' \
  --cookie "your-auth-cookie"

# Test time metrics API
curl http://your-domain/api/admin/time-metrics \
  --cookie "your-admin-auth-cookie"
```

## Monitoring & Maintenance

### 1. Performance Monitoring
- [ ] **Database Query Performance**
  - Monitor view tracking query performance
  - Check for slow queries in access logs
  - Optimize indexes if needed

- [ ] **API Response Times**
  - Monitor `/api/bank/application-view` response times
  - Check for timeouts or errors
  - Monitor analytics API performance

### 2. Data Quality Checks
- [ ] **View Tracking Data**
  - Verify view records are being created
  - Check for duplicate or missing records
  - Monitor data consistency

- [ ] **Time Metrics Accuracy**
  - Compare calculated times with expected values
  - Verify hours display correctly
  - Check for negative or unrealistic times

### 3. Error Monitoring
- [ ] **Application Errors**
  - Monitor for view tracking failures
  - Check for authentication errors
  - Monitor database connection issues

- [ ] **User Experience**
  - Check for broken functionality
  - Monitor user complaints
  - Verify analytics dashboard loads correctly

## Rollback Plan

### If Issues Occur
1. **Disable View Tracking**
   - Comment out `useViewTracking` hook calls
   - Revert to old time metrics calculation
   - Keep database tables for data preservation

2. **Database Rollback**
   ```sql
   -- If needed, disable tracking functions
   DROP FUNCTION IF EXISTS record_application_view();
   DROP FUNCTION IF EXISTS record_offer_preparation_start();
   DROP FUNCTION IF EXISTS record_offer_preparation_end();
   ```

3. **Code Rollback**
   - Revert to previous version
   - Remove view tracking components
   - Restore old analytics calculations

## Success Criteria

### ✅ View Tracking Working
- [ ] Bank views are recorded when accessing applications
- [ ] Offer preparation times are tracked
- [ ] Access logs contain accurate timestamps
- [ ] No performance degradation

### ✅ Analytics Accuracy
- [ ] Response times show realistic values (hours, not 1830.5 minutes)
- [ ] Offer times reflect actual preparation periods
- [ ] Conversion rates are calculated correctly
- [ ] Bank performance table shows accurate data

### ✅ User Experience
- [ ] No visible changes to bank user interface
- [ ] Analytics dashboard loads quickly
- [ ] No errors in browser console
- [ ] All existing functionality works

## Post-Deployment Tasks

### 1. Remove Test Components
- [ ] Remove `ViewTrackingTest` component from production
- [ ] Clean up any test code
- [ ] Remove console.log statements

### 2. Documentation Updates
- [ ] Update API documentation
- [ ] Document new time metrics calculations
- [ ] Create user guides for analytics

### 3. Training
- [ ] Train admin users on new analytics
- [ ] Explain time metrics to stakeholders
- [ ] Document troubleshooting procedures

## Future Enhancements

### Phase 2 Features
- [ ] **Advanced Analytics Dashboard**
- [ ] **Real-time Notifications**
- [ ] **Performance Scoring**
- [ ] **Predictive Analytics**

### Performance Optimizations
- [ ] **Database Indexing**
- [ ] **Query Optimization**
- [ ] **Caching Strategy**
- [ ] **Data Archiving**

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Status:** _______________
**Notes:** _______________
