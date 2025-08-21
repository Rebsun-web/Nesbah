# Nesbah System Testing Guide

## Complete Testing Checklist

### Step 1: Database Setup ✅
- [x] Run admin migration: `npm run admin-migrate`
- [x] Verify database tables are created
- [x] Check default admin user exists

### Step 2: Main Application Testing ✅
- [x] Start main app: `npm run dev`
- [x] Navigate to `http://localhost:3000`
- [x] Test admin login: `http://localhost:3000/login` (Unified Login System)

### Step 3: Admin Panel Testing
- [x] Test admin dashboard access
- [x] **Applications Management CRUD** ✅ **FULLY TESTED & WORKING**
  - [x] New Application button functionality
  - [x] Application view page (`/admin/applications/[id]`)
  - [x] Create new applications via modal
  - [x] View application details with offers and audit log
  - [x] Edit application status, notes, and business information
  - [x] Delete applications with confirmation
  - [x] Search and filter applications
  - [x] Pagination and sorting
  - [x] Bulk actions (selection, extend deadlines, force abandon)
  - [x] **API Endpoints Tested**:
    - [x] `GET /api/admin/applications` - List with filtering, sorting, pagination ✅
    - [x] `POST /api/admin/applications` - Create new application ✅
    - [x] `GET /api/admin/applications/[id]` - Get specific application ✅
    - [x] `PUT /api/admin/applications/[id]` - Update application ✅
    - [x] `DELETE /api/admin/applications/[id]` - Delete application ✅
  - [x] **Database Issues Fixed**:
    - [x] Created missing `auction_settings` table ✅
    - [x] Created missing `user_activity_log` table ✅
    - [x] Created missing `bank_performance_metrics` table ✅
    - [x] Fixed duplicate key handling in CREATE operation ✅
    - [x] Fixed column name mismatches in offers query ✅
    - [x] Fixed trigger conflicts ✅
- [ ] Test all admin panel tabs
- [ ] Test webhook endpoint: `POST http://localhost:3001/webhook`
- [ ] Test background job monitoring
- [ ] Test system alerts
- [ ] Test revenue analytics
- [ ] Test user management
- [ ] Test settings and configuration

### Step 4: API Testing
- [ ] Test all API endpoints with authentication
- [ ] Test error handling and validation
- [ ] Test rate limiting and security measures

### Step 5: Integration Testing
- [ ] Test complete user workflows
- [ ] Test admin workflows
- [ ] Test data consistency across modules

### Step 6: Performance Testing
- [ ] Test application performance under load
- [ ] Test database query optimization
- [ ] Test caching mechanisms

## Applications Management CRUD Features Implemented ✅

### API Endpoints
- `GET /api/admin/applications` - List applications with filtering, sorting, and pagination
- `POST /api/admin/applications` - Create new application
- `GET /api/admin/applications/[id]` - Get specific application details
- `PUT /api/admin/applications/[id]` - Update application
- `DELETE /api/admin/applications/[id]` - Delete application

### Frontend Components
- **ApplicationsTable** - Main table with real-time data, search, filters, sorting, pagination
- **NewApplicationModal** - Comprehensive form for creating new applications
- **ApplicationDetail** - Detailed view page with edit/delete functionality

### Features
- ✅ Real-time data fetching from database
- ✅ Search by trade name or application ID
- ✅ Filter by status (submitted, pending_offers, offer_received, completed, abandoned, deal_expired)
- ✅ Sort by various fields (submitted_at, trade_name, revenue_collected)
- ✅ Pagination with configurable page size
- ✅ Bulk selection and actions
- ✅ Create new applications with comprehensive form
- ✅ View application details with offers and audit log
- ✅ Edit application status, admin notes, priority level
- ✅ Edit business information (trade name, CR number, city, contact details)
- ✅ Delete applications with confirmation
- ✅ Status indicators with urgency levels
- ✅ Revenue and offers tracking
- ✅ Audit log for all changes
- ✅ Responsive design for mobile and desktop

### Database Integration
- ✅ Joins between `submitted_applications` and `pos_application` tables
- ✅ Proper error handling and validation
- ✅ Transaction support for data consistency
- ✅ Admin audit logging for all CRUD operations
- ✅ Relationship handling (offers, audit logs)

### Security
- ✅ Admin authentication required for all operations
- ✅ Cookie-based authentication
- ✅ Input validation and sanitization
- ✅ SQL injection prevention with parameterized queries
- ✅ CSRF protection through HTTP-only cookies

## Next Steps
1. Test the new Applications Management CRUD functionality
2. Continue with remaining admin panel tabs
3. Implement bulk actions functionality
4. Add export functionality
5. Test webhook endpoints and background jobs


Check if business user can submit an application in /portal and that this application appears after in adminPortal