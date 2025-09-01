# Lead Generation System - Banking Partners

## Overview
This document outlines the implementation of the lead generation system for banking partners, which includes masked contact information until an offer is submitted.

## 3. Lead Generation to Banking Partners

### 3.1 Data Sent to Banks
When distributing leads to banking partners, the system includes the following information with contact details masked until an offer is submitted:

#### Business Information
- **Business Name** - Company trade name
- **CR Number** - Commercial Registration Number
- **CR National Number** - CR National Number
- **Legal Form** - Legal entity type
- **CR Status** - Registration status
- **CR Issue Date** - Date of registration
- **City** - Business location

#### Business Activities
- **Business Activities** - Array of business activities
- **Sector** - Business sector/industry

#### POS Application Details
- **Monthly POS Sales Amount** - Average monthly sales through POS
- **POS Age in Months** - Duration of POS system usage
- **Requested Financing Amount** - Amount requested for financing
- **Preferred Repayment Period** - Preferred repayment timeline

#### Contact Information (Masked)
- **Contact Person** - Masked as "A***" (first letter + asterisks)
- **Phone Number** - Masked as "05********"
- **Email** - Masked as "***@***.com"

## Implementation Details

### Database Schema Updates
The following new fields were added to the `pos_application` table:

```sql
ALTER TABLE pos_application ADD COLUMN IF NOT EXISTS:
- pos_provider_name VARCHAR(255)
- pos_age_duration_months INTEGER
- avg_monthly_pos_sales DECIMAL(15,2)
- requested_financing_amount DECIMAL(15,2)
- preferred_repayment_period_months INTEGER
```

### Frontend Components

#### 1. POS Application Form (`src/components/posApplication.jsx`)
- Added new form fields for POS application details
- Includes validation for required fields
- Sends data to backend API

#### 2. Bank Leads Table (`src/components/BankLeadsTable.jsx`)
- Displays all required lead generation fields
- Groups information into logical columns:
  - Business Info
  - CR Details
  - Business Activities
  - POS Details
  - Financial Info
  - Contact Info (Masked)
- Shows masked contact information by default

#### 3. Unmasked Contact Info (`src/components/UnmaskedContactInfo.jsx`)
- New component for displaying unmasked contact information
- Only accessible after offer submission
- Includes toggle to show/hide details
- Displays complete contact and business information

### API Endpoints

#### 1. Leads API (`/api/leads`)
- Returns all required fields for lead generation
- Includes masked contact information
- Supports both bank users and bank employees

#### 2. Unmasked Contact API (`/api/leads/[id]/unmasked-contact`)
- Returns unmasked contact information
- Only accessible after offer submission
- Includes security checks for bank access

#### 3. POS Application API (`/api/posApplication`)
- Handles new POS application fields
- Stores all required information

#### 4. Admin Applications API (`/api/admin/applications`)
- Supports creation of applications with new fields
- Includes admin portal integration

### Bank Portal Integration

#### Incoming Applications Table
- Displays all required fields in organized columns
- Contact information is masked by default
- Shows countdown timer for auction end

#### Lead Details View
- Modal popup with comprehensive lead information
- Unmasked contact information accessible after offer submission
- Organized display of all business and POS details

#### Security Features
- Contact information masking until offer submission
- Bank user authentication required
- Employee access through bank user ID resolution

## Data Flow

### 1. Lead Creation
1. Business submits POS application with all required fields
2. System stores data in `pos_application` table
3. Lead becomes available in bank portal

### 2. Lead Distribution
1. Banks view leads with masked contact information
2. All business and POS details are visible
3. Contact details are masked for privacy

### 3. Offer Submission
1. Bank submits offer for lead
2. System unlocks unmasked contact information
3. Bank can access complete business details

### 4. Contact Information Access
1. Unmasked contact info available in lead tab
2. Complete business and contact details displayed
3. Secure access through API authentication

## Security and Privacy

### Contact Information Protection
- **Before Offer**: All contact details are masked
- **After Offer**: Full contact information accessible
- **Access Control**: Only authenticated bank users can view

### Data Masking Rules
- **Names**: First letter + asterisks (e.g., "A***")
- **Phone**: "05********" format
- **Email**: "***@***.com" format

### Authentication Requirements
- Bank user authentication required
- Employee access through bank association
- Offer submission verification for unmasked data

## User Experience

### Bank Users
- Clear view of all business information
- Masked contact details until offer submission
- Easy access to unmasked information after offer
- Organized data presentation

### Business Users
- Complete form for POS application
- All required fields clearly marked
- Validation and error handling
- Secure data submission

## Future Enhancements

### Additional Fields
- Financial statements
- Credit history
- Business performance metrics
- Market analysis data

### Advanced Features
- Lead scoring algorithms
- Automated lead distribution
- Performance analytics
- Integration with banking systems

---

This system ensures that banking partners have access to comprehensive business information while maintaining the privacy of contact details until they commit to submitting an offer.
