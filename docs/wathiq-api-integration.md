# Wathiq API Integration - Complete Field Mapping

## Overview
This document outlines the complete integration with the Saudi Wathiq API for commercial registration data, ensuring all required fields are properly parsed, stored, and displayed throughout the system.

## 1.1 Required Data Fields from Wathiq API

When a business enters their CR number, the system fetches and saves the following fields:

### Basic CR Information
- **crNumber** - Commercial Registration Number
- **crNationalNumber** - CR National Number  
- **name** - Business Name
- **entityType.formName** - Legal Form
- **status.name** - CR Status

### Address and Location
- **headquarterCityName** - City
- **headquarterDistrictName** - District
- **headquarterStreetName** - Street
- **headquarterBuildingNumber** - Building Number

### Business Activities
- **activities[]** - Business Activities Array
- **sector** - Business Sector (derived from activities)

### Capital Information
- **crCapital** - CR Capital
- **capital.contributionCapital.cashCapital** - Cash Capital
- **capital.contributionCapital.inKindCapital** - In-Kind Capital

### Dates
- **issueDateGregorian** - CR Issue Date
- **confirmationDate.gregorian** - Confirmation Date

### E-commerce
- **hasEcommerce** - E-commerce Flag
- **eCommerce.eStore[0].storeUrl** - Store URL (if exists)

### Management
- **management.structureName** - Management Structure
- **management.managers[].name** - Manager Names

### Contact Information
- **contactInfo.email** - Email
- **contactInfo.mobile** - Mobile
- **contactInfo.phone** - Phone

## 2. Database Schema

### business_users Table
The system stores all Wathiq API data in the `business_users` table with the following structure:

```sql
CREATE TABLE business_users (
    -- Basic Information
    user_id SERIAL PRIMARY KEY,
    cr_national_number VARCHAR(50) UNIQUE,
    cr_number VARCHAR(50),
    trade_name VARCHAR(255),
    legal_form VARCHAR(255),
    registration_status VARCHAR(50),
    
    -- Address and Location
    headquarter_city_name VARCHAR(255),
    headquarter_district_name VARCHAR(255),
    headquarter_street_name VARCHAR(255),
    headquarter_building_number VARCHAR(50),
    address TEXT,
    city VARCHAR(255),
    
    -- Business Activities
    sector TEXT,
    activities TEXT[],
    
    -- Capital Information
    cr_capital DECIMAL(20,2),
    cash_capital DECIMAL(20,2),
    in_kind_capital DECIMAL(20,2),
    avg_capital DECIMAL(20,2),
    
    -- Dates
    issue_date_gregorian DATE,
    confirmation_date_gregorian DATE,
    
    -- E-commerce
    has_ecommerce BOOLEAN DEFAULT false,
    store_url VARCHAR(500),
    
    -- Management
    management_structure VARCHAR(255),
    management_managers TEXT[],
    
    -- Contact Information (from Wathiq)
    contact_info JSONB,
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP,
    admin_notes TEXT,
    
    -- Additional fields for compatibility
    contact_person VARCHAR(255),
    contact_person_number VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 3. Data Flow

### 3.1 Business Registration
1. User enters CR National Number
2. System calls Wathiq API for verification
3. All required fields are parsed and stored
4. Business user account is created with verified data

### 3.2 Data Display

#### Business Portal
- **Visible Fields**: All Wathiq API fields + business contact information
- **Purpose**: Business users can view their complete company information

#### Bank Portal
- **Visible Fields**: All Wathiq API fields EXCEPT contact information
- **Purpose**: Banks can view business details for lead evaluation
- **Export**: Excel files include all Wathiq data for approved leads

### 3.3 Data Export
When bank users export approved leads to Excel, the following data is included:

#### Wathiq Business Data
- Company Name, CR Number, CR National Number
- Legal Form, Registration Status
- Issue Date, Confirmation Date
- Address, City, Sector, Activities
- CR Capital, Cash Capital, In-Kind Capital, Average Capital
- E-commerce status and Store URL
- Management Structure and Manager Names

#### Business Contact Information (NOT from Wathiq)
- Contact Person Name
- Phone Number
- Email Address

#### Application and Offer Details
- POS application details
- Bank offer information
- Financial terms and conditions

## 4. API Endpoints

### 4.1 Business Verification
```
POST /api/users/register/business_users/verify
```
- Verifies CR number with Wathiq API
- Returns comprehensive business data

### 4.2 Business Registration
```
POST /api/users/register/business_users
```
- Creates business user account
- Stores all Wathiq API data

### 4.3 Admin Business Creation
```
POST /api/admin/users/create-business
```
- Admin can create business users
- Option to fetch from Wathiq API or manual entry

## 5. Data Processing

### 5.1 Wathiq API Service
The `WathiqAPIService` class handles:
- API communication with Wathiq
- Data parsing and extraction
- Field mapping and validation
- Error handling and fallbacks

### 5.2 Field Extraction Methods
- `extractRegistrationStatus()` - Maps status codes to readable names
- `extractAddress()` - Combines address components
- `extractSector()` - Derives sector from activities
- `extractCapital()` - Handles various capital formats
- `extractContactInfo()` - Processes contact information
- `extractManagementManagers()` - Extracts manager names

## 6. Security and Privacy

### 6.1 Contact Information Protection
- **Business Portal**: Full access to contact information
- **Bank Portal**: Contact information is hidden for non-purchased leads
- **Export**: Contact information included only for approved leads

### 6.2 Data Verification
- All Wathiq API data is marked as verified
- Verification timestamp is recorded
- Admin notes can be added for additional context

## 7. Performance Optimization

### 7.1 Database Indexes
- Indexes on frequently queried fields
- GIN indexes for array fields (activities, management_managers)
- Composite indexes for complex queries

### 7.2 Caching Strategy
- Wathiq API responses can be cached
- Business data is stored locally after verification
- Regular updates ensure data freshness

## 8. Error Handling

### 8.1 Wathiq API Failures
- Graceful fallback to manual entry
- Clear error messages for users
- Retry mechanisms for temporary failures

### 8.2 Data Validation
- Required field validation
- Format validation for dates and numbers
- Fallback values for missing data

## 9. Future Enhancements

### 9.1 Additional Wathiq Fields
- Financial statements
- Shareholder information
- Branch locations
- License information

### 9.2 Integration Features
- Automatic data updates
- Change notifications
- Compliance monitoring
- Audit trails

## 10. Compliance Notes

- All data handling follows Saudi data protection regulations
- Contact information is protected as per business requirements
- Export functionality respects data privacy rules
- Audit trails maintain data integrity

---

This integration ensures that all required Wathiq API fields are properly captured, stored, and displayed throughout the system while maintaining data security and user privacy.
