# Business Owner Details & BoughtLeadsDisplay Implementation

## Overview
This implementation ensures that banks receive business owner personal details (contact person, telephone number, email) that are NOT provided by the Wathiq API, and provides a comprehensive BoughtLeadsDisplay component for the bank portal with XLSX export functionality.

## Key Features Implemented

### 1. Business Owner Personal Details Separation

#### **Data Structure**
- **Wathiq API Data**: Official business registration information (CR number, sector, capital, etc.)
- **Manual Contact Details**: Personal contact information provided by business owners during application

#### **Personal Details Available to Banks**
When a bank purchases a lead, they receive:

**Business Owner Personal Details (NOT from Wathiq API):**
- `business_contact_person` - Contact person name
- `business_contact_telephone` - Contact telephone number  
- `business_contact_email` - Contact email address

**Business Information (Wathiq API):**
- `contact_info` - Official business contact information from Wathiq
- All other business registration details

### 2. Updated API Endpoints

#### **Lead Details API** (`/api/leads/[id]/route.jsx`)
- **Enhanced**: Now includes business owner personal details
- **Security**: Personal details only shown to banks who have purchased the lead
- **Data Separation**: Clear distinction between Wathiq API data and manual contact details

#### **Purchased Leads API** (`/api/leads/purchased/route.jsx`)
- **New Endpoint**: Returns all leads purchased by a specific bank
- **Complete Data**: Includes both Wathiq API data and business owner personal details
- **Offer Information**: Shows the bank's submitted offers for each lead

#### **XLSX Export API** (`/api/leads/purchased/export/route.jsx`)
- **New Endpoint**: Exports purchased leads as Excel file
- **Comprehensive Data**: All business information, personal details, and offer data
- **Formatted Output**: Properly formatted Excel with headers and styling

### 3. BoughtLeadsDisplay Component

#### **Features**
- **Real-time Data**: Fetches purchased leads from the API
- **Comprehensive Display**: Shows all business and personal information
- **Status Tracking**: Displays application status with visual indicators
- **Offer Details**: Shows the bank's submitted offers
- **XLSX Export**: One-click export to Excel format

#### **UI Sections**
1. **Header**: Lead count and export button
2. **Business Information**: Wathiq API data (CR number, sector, capital, etc.)
3. **Business Owner Contact Details**: Personal contact information (highlighted in blue)
4. **Offer Information**: Bank's submitted offer details (highlighted in green)
5. **Additional Details**: Revenue, document uploads, timestamps

#### **Visual Design**
- **Responsive Layout**: Works on desktop and mobile
- **Color Coding**: Different sections highlighted with appropriate colors
- **Icons**: Visual indicators for different types of information
- **Status Badges**: Clear status indicators for each lead

### 4. Bank Portal Integration

#### **Updated Bank Portal** (`/app/bankPortal/page.jsx`)
- **New Section**: Added BoughtLeadsDisplay component
- **Three Sections**:
  1. Dashboard stats
  2. Incoming applications
  3. **Purchased leads** (new)

#### **Navigation**
- **Seamless Integration**: Component fits naturally into existing portal
- **User Experience**: Banks can easily view and export their purchased leads

## Technical Implementation

### 1. Database Queries

#### **Enhanced Lead Details Query**
```sql
SELECT
    -- Business Information (Wathiq API data)
    bu.trade_name, bu.cr_number, bu.sector, bu.cr_capital,
    bu.contact_info, bu.has_ecommerce, bu.store_url,
    
    -- Business Owner Personal Details (NOT from Wathiq API)
    pa.contact_person as business_contact_person,
    pa.contact_person_number as business_contact_telephone,
    u.email as business_contact_email,
    
    -- Application Details
    pa.notes, pa.number_of_pos_devices, pa.city_of_operation
FROM pos_application pa
JOIN business_users bu ON pa.user_id = bu.user_id
JOIN users u ON bu.user_id = u.user_id
WHERE pa.application_id = $1
```

#### **Purchased Leads Query**
```sql
SELECT 
    sa.application_id, sa.status, sa.submitted_at,
    -- Business Information (Wathiq API data)
    bu.trade_name, bu.cr_number, bu.sector, bu.cr_capital,
    bu.contact_info, bu.has_ecommerce, bu.store_url,
    
    -- Business Owner Personal Details (NOT from Wathiq API)
    pa.contact_person as business_contact_person,
    pa.contact_person_number as business_contact_telephone,
    u.email as business_contact_email,
    
    -- Offer Information
    ao.offer_device_setup_fee, ao.offer_transaction_fee_mada,
    ao.offer_transaction_fee_visa_mc, ao.offer_settlement_time_mada
FROM submitted_applications sa
JOIN pos_application pa ON sa.application_id = pa.application_id
JOIN business_users bu ON pa.user_id = bu.user_id
JOIN users u ON bu.user_id = u.user_id
LEFT JOIN application_offers ao ON sa.id = ao.submitted_application_id 
    AND ao.submitted_by_user_id = $1
WHERE $1 = ANY(sa.purchased_by)
ORDER BY sa.submitted_at DESC
```

### 2. Security Implementation

#### **Access Control**
- **Authentication**: All endpoints require bank user ID
- **Authorization**: Only banks who purchased leads can see personal details
- **Data Protection**: Personal details hidden until lead is purchased

#### **Data Privacy**
- **Wathiq Data**: Official business information (public)
- **Personal Data**: Contact details only shared with purchasing banks
- **Audit Trail**: All access is logged and tracked

### 3. XLSX Export Implementation

#### **ExcelJS Integration**
- **Comprehensive Export**: All lead data in structured format
- **Formatted Data**: Proper currency, percentage, and date formatting
- **Styled Headers**: Professional Excel appearance
- **Column Widths**: Optimized for readability

#### **Export Features**
- **Complete Dataset**: All business and personal information
- **Offer Details**: Bank's submitted offers included
- **Timestamps**: All relevant dates and times
- **Formatted Values**: Currency, percentages, and dates properly formatted

## Data Flow

### 1. Lead Purchase Process
1. Bank views lead details (limited information)
2. Bank purchases lead (pays 25 SAR)
3. Bank gains access to business owner personal details
4. Bank can submit offers and view complete information

### 2. Data Access Control
```
Before Purchase:
├── Business Information (Wathiq API) ✅
├── Application Details ✅
└── Personal Contact Details ❌

After Purchase:
├── Business Information (Wathiq API) ✅
├── Application Details ✅
├── Personal Contact Details ✅
└── Offer Submission ✅
```

### 3. Export Process
1. Bank clicks "Export XLSX" button
2. API generates comprehensive Excel file
3. File includes all purchased leads with complete data
4. Download starts automatically

## Testing Results

### **Test Findings**
- ✅ Business owner personal details properly separated from Wathiq API data
- ✅ Contact person, telephone, and email available for banks
- ✅ API structure supports both Wathiq and manual contact information
- ✅ Data access control working correctly
- ✅ XLSX export functionality ready

### **Sample Data**
```
Business: Automotive Excellence
├── Wathiq Contact Info: {"email":"cr010@nesbah.com","phone":"+966500123456"}
├── Manual Contact Person: Yousef Al-Dossary
├── Manual Contact Telephone: +966500123456
└── Manual Contact Email: cr010@nesbah.com
```

## Benefits

### 1. **For Banks**
- **Complete Information**: Access to both business and personal contact details
- **Easy Export**: One-click XLSX export for all purchased leads
- **Better Follow-up**: Direct contact information for business development
- **Organized Data**: Structured view of all purchased leads

### 2. **For Business Owners**
- **Privacy Protection**: Personal details only shared with purchasing banks
- **Control**: They provide their own contact information
- **Transparency**: Clear separation between official and personal data

### 3. **For System**
- **Data Integrity**: Clear separation of data sources
- **Scalability**: Efficient queries and data structure
- **Security**: Proper access control and data protection
- **User Experience**: Intuitive interface and functionality

## Future Enhancements

### 1. **Advanced Export Options**
- Filter by date range
- Export specific lead types
- Custom column selection
- Multiple format support (CSV, PDF)

### 2. **Enhanced Contact Management**
- Contact history tracking
- Follow-up reminders
- Communication logs
- Lead scoring

### 3. **Analytics Integration**
- Lead performance metrics
- Conversion tracking
- Revenue analytics
- Bank performance dashboards

## Usage Instructions

### **For Banks**
1. **View Purchased Leads**: Navigate to bank portal to see all purchased leads
2. **Access Personal Details**: Click on any purchased lead to see contact information
3. **Export Data**: Use "Export XLSX" button to download complete dataset
4. **Follow Up**: Use provided contact details for business development

### **For Developers**
1. **API Endpoints**: Use `/api/leads/purchased` for lead data
2. **Export Function**: Use `/api/leads/purchased/export` for XLSX export
3. **Component**: Import `BoughtLeadsDisplay` for UI integration
4. **Security**: Ensure proper authentication and authorization

The implementation is complete and ready for production use! 🚀
