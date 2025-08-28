# Nesbah Admin Panel - Implementation Guide

## Overview

The Admin Panel is a comprehensive system interface for internal operations, providing Nesbah's staff with full access and control over the dual-auction system, application lifecycle management, and revenue oversight.

## 🚀 Quick Start

### 1. Database Setup

Run the admin panel database migration:

```bash
node scripts/run-admin-migration.js
```

This will create all required tables, indexes, and views for the admin panel functionality.

### 2. Default Admin User

A default admin user is created during migration:
- **Email**: `admin@nesbah.com`
- **Password**: `changeme` (MUST be changed in production)
- **Role**: `super_admin`

## 📊 Database Schema

### New Tables Created

#### 1. `status_audit_log`
Tracks manual status transitions with audit trail.

```sql
CREATE TABLE status_audit_log (
    log_id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL,
    from_status VARCHAR(20) NOT NULL,
    to_status VARCHAR(20) NOT NULL,
    admin_user_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

#### 2. `auction_deadlines`
Tracks deadline extensions for auctions and selections.

```sql
CREATE TABLE auction_deadlines (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL,
    phase VARCHAR(20) NOT NULL CHECK (phase IN ('auction', 'selection')),
    original_deadline TIMESTAMP NOT NULL,
    extended_deadline TIMESTAMP NOT NULL,
    extension_reason TEXT NOT NULL,
    admin_user_id INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

#### 3. `offer_status_audit_log`
Tracks offer status changes for data integrity.

```sql
CREATE TABLE offer_status_audit_log (
    log_id SERIAL PRIMARY KEY,
    offer_id INTEGER NOT NULL,
    application_id INTEGER NOT NULL,
    from_status VARCHAR(20) NOT NULL,
    to_status VARCHAR(20) NOT NULL,
    admin_user_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

#### 4. `revenue_collections`
Detailed revenue tracking with transaction status.

```sql
CREATE TABLE revenue_collections (
    collection_id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL,
    bank_user_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 25.00,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    transaction_reference VARCHAR(100),
    collection_method VARCHAR(20) DEFAULT 'bank_purchase',
    notes TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

#### 5. `admin_users`
Admin authentication and role management.

```sql
CREATE TABLE admin_users (
    admin_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 6. `system_alerts`
System monitoring and alert management.

```sql
CREATE TABLE system_alerts (
    alert_id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id INTEGER,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by INTEGER,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 7. `business_intelligence_metrics`
BI reporting and analytics data.

```sql
CREATE TABLE business_intelligence_metrics (
    metric_id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    calculation_date DATE NOT NULL,
    time_period VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Database Views

#### `admin_urgent_applications`
Applications requiring immediate attention with urgency levels.

#### `admin_revenue_summary`
Daily revenue collection summaries for reporting.

## 🔌 API Endpoints

### Application Management

#### 1. Status Dashboard
```
GET /api/admin/applications/status-dashboard
```
Provides real-time monitoring of all application statuses with countdown timers and engagement metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "statusCounts": [
      {
        "status": "pending_offers",
        "count": 15,
        "active_auctions": 12,
        "expired_auctions": 3
      }
    ],
    "urgentApplications": [...],
    "revenueAnalytics": {...},
    "bankEngagement": [...]
  }
}
```

#### 2. Force Status Transition
```
POST /api/admin/applications/force-transition
```
Allows manual status transitions with audit logging.

**Request:**
```json
{
  "application_id": 123,
  "from_status": "pending_offers",
  "to_status": "offer_received",
  "reason": "Manual intervention due to system issue"
}
```

#### 3. Extend Deadline
```
POST /api/admin/applications/extend-deadline
```
Extends auction or selection deadlines with proper tracking.

**Request:**
```json
{
  "application_id": 123,
  "phase": "auction",
  "extension_hours": 24,
  "reason": "Bank requested extension"
}
```

### Offer Management

#### 4. Bulk Offer Status Update
```
PUT /api/admin/offers/bulk-status-update
```
Updates multiple offer statuses with audit trail.

**Request:**
```json
{
  "offer_ids": [1, 2, 3],
  "new_status": "deal_lost",
  "reason": "Business user selected different offer"
}
```

#### 5. List Offers
```
GET /api/admin/offers/bulk-status-update?application_id=123&status=submitted
```
Lists offers with filtering and pagination.

### Revenue Management

#### 6. Revenue Collection Status
```
GET /api/admin/revenue/collection-status
```
Real-time revenue tracking and financial oversight.

**Response:**
```json
{
  "success": true,
  "data": {
    "revenueAnalytics": {
      "total_revenue": 1250.00,
      "completed_applications": 50,
      "avg_revenue_per_application": 25.00
    },
    "revenueCollections": [...],
    "bankAnalytics": [...],
    "optimizationRecommendations": [...],
    "paymentFailures": [...]
  }
}
```

### User Management

#### 7. List Users
```
GET /api/admin/users?user_type=business&registration_status=active
```
Lists users with filtering by type and status.

#### 8. Create User
```
POST /api/admin/users
```
Creates new users with proper role assignment.

**Request:**
```json
{
  "user_type": "business",
  "email": "business@example.com",
  "entity_name": "Example Business",
  "registration_status": "active"
}
```

### System Monitoring

#### 9. System Alerts
```
GET /api/admin/system/alerts?severity=high&is_resolved=false
```
Lists system alerts with filtering.

#### 10. Create Alert
```
POST /api/admin/system/alerts
```
Creates new system alerts.

**Request:**
```json
{
  "alert_type": "payment_failure",
  "severity": "high",
  "title": "Payment Processing Error",
  "message": "Multiple payment failures detected",
  "related_entity_type": "application",
  "related_entity_id": 123
}
```

#### 11. Resolve Alert
```
PUT /api/admin/system/alerts
```
Marks alerts as resolved.

**Request:**
```json
{
  "alert_id": 456,
  "is_resolved": true
}
```

## 🔐 Security Implementation

### Authentication (TODO)
- Multi-factor authentication (MFA) for admin access
- Session management with secure tokens
- Role-based access control (RBAC)

### Audit Logging
- All manual status overrides are logged with reasons
- Revenue transaction immutability with tamper-evident logging
- Comprehensive audit trail for compliance

### Permissions
- **super_admin**: Full system access
- **admin**: Standard admin operations
- **read_only**: View-only access

## ⚡ Critical Timing Mechanisms

The system handles precise timing for the dual-auction flow:

1. **Immediate transition**: `submitted` → `pending_offers` (brief system delay)
2. **48-hour countdown**: `pending_offers` → `offer_received`/`abandoned`
3. **24-hour countdown**: `offer_received` → `completed`/`deal_expired`

Manual interventions require audit trails with business justification.

## 📈 Business Intelligence Features

### Conversion Rate Analysis
- Submitted → completed percentage tracking
- Bank engagement patterns and success rates
- Application abandonment rate analysis

### Revenue Optimization
- Real-time revenue dashboard (25 SAR per bank purchase)
- Bank purchase analytics across all application statuses
- Payment failure investigation and resolution

### System Health Monitoring
- Background job health monitoring
- Email notification delivery tracking
- Deadline approaching notifications

## 🛠️ Development Notes

### TODO Items
1. **Admin Authentication Middleware**: Implement secure admin authentication
2. **MFA Integration**: Add multi-factor authentication
3. **Email Notifications**: Admin alert notifications
4. **Frontend Dashboard**: React-based admin interface
5. **Background Jobs**: Automated status transition monitoring
6. **API Rate Limiting**: Protect admin endpoints

### Performance Considerations
- Database indexes optimized for admin queries
- Pagination implemented for large datasets
- Caching for frequently accessed metrics
- Background processing for heavy operations

### Error Handling
- Comprehensive error logging
- Graceful degradation for system failures
- Rollback mechanisms for failed transactions
- Alert generation for critical errors

## 🚨 Production Checklist

- [ ] Change default admin password
- [ ] Configure MFA for all admin accounts
- [ ] Set up monitoring and alerting
- [ ] Implement rate limiting
- [ ] Configure backup and recovery
- [ ] Set up audit log retention policies
- [ ] Test all admin operations
- [ ] Document admin procedures
- [ ] Train admin users on system usage

## 📞 Support

For technical support or questions about the Admin Panel implementation, please refer to the development team or create an issue in the project repository.

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: Implementation Complete (Backend API + Database)
