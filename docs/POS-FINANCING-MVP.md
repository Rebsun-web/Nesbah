# POS Financing MVP Implementation

## Overview
This document describes the implementation of the POS Financing MVP switch for Nesbah platform, which focuses exclusively on POS Financing services while keeping other features hidden but accessible for testing.

## Feature Flags & Configuration

### Core Configuration
The feature configuration is managed in `src/lib/config/features.js`:

```javascript
export const features = {
  // Core features
  showPosFinancing: true,
  showPosDevices: false,
  showPaymentGateway: false,
  
  // Auction configuration
  auctionWindow: {
    posFinancing: {
      defaultHours: 48,
      minRequestedAmount: 10000, // SAR
      maxRequestedAmount: 5000000, // SAR
    }
  },
  
  // Access control
  accessControl: {
    hiddenRoutes: {
      posDevices: '/pos-devices',
      paymentGateway: '/payment-gateway',
    },
    adminRoles: ['admin', 'super_admin', 'developer']
  }
}
```

### How to Toggle Features
1. **Enable/Disable POS Financing**: Set `features.showPosFinancing` to `true`/`false`
2. **Show Hidden Routes**: Set `features.showPosDevices` and `features.showPaymentGateway` to `true`
3. **Access Control**: Modify `features.accessControl.adminRoles` array to control who can access hidden features

## POS Financing Field Requirements

### Client Application Fields

#### Auto-fetched via Wathiq (Read-only)
- Business Name
- CR Number
- CR National Number
- Legal Form
- CR Status
- CR Issue Date
- City / Headquarter city
- Business Activities
- Contact info & e-commerce flag/url (if available)

#### Manual Inputs (Required unless noted)
- **POS Provider Name**: Select or free text
- **POS Age**: Number of months
- **Average Monthly POS Sales**: Amount in SAR
- **Requested Financing Amount**: Amount in SAR
- **Preferred Repayment Period**: Number of months (optional)
- **Contact Person**: Full name
- **Mobile**: Phone number
- **Email**: Email address
- **Notes**: Additional information (optional)
- **File Upload**: IBAN letter or POS statements (PDF/JPG/PNG, max 10MB)

### Bank Offer Submission Fields

#### Required Fields
- **Approved Financing Amount (SAR)**: Numeric with decimal support
- **Proposed Repayment Period (months)**: Integer
- **Interest/Profit Rate (%)**: Numeric with decimal support
- **Monthly Installment Amount (SAR)**: Numeric with decimal support
- **Relationship Manager Name**: Text
- **Relationship Manager Phone**: Phone number
- **Relationship Manager Email**: Email address

#### Optional Fields
- **Supporting Documents**: File uploads (PDF, DOC, DOCX, XLS, XLSX, max 10MB each)

## Data Model & Validation

### Client Application Validation
- CR Number is required and must be valid
- Requested amount must be between SAR 10,000 and SAR 5,000,000
- File uploads are limited to 10MB per file
- Supported file types: PDF, JPG, PNG, DOC, DOCX

### Bank Offer Validation
- All required fields must be provided
- Numeric fields must be positive values
- File uploads are validated for size and type
- Email addresses must be valid format

## Auction Window Configuration

### Default Settings
- **Duration**: 48 hours
- **Minimum Amount**: SAR 10,000
- **Maximum Amount**: SAR 5,000,000

### Configuration Override
Auction windows can be configured per provider by modifying the `features.auctionWindow.posFinancing` object.

## File Upload System

### Upload Directory Structure
```
public/uploads/
└── bank-offers/
    └── {leadId}/
        ├── {timestamp}_filename1.pdf
        ├── {timestamp}_filename2.docx
        └── ...
```

### File Validation
- **Size Limit**: 10MB per file
- **Supported Types**: PDF, DOC, DOCX, XLS, XLSX
- **Security**: Files are scanned for viruses and validated server-side

## API Endpoints

### Client Application
- `POST /api/applications/pos-financing` - Submit POS financing application
- `GET /api/applications/{id}` - Get application details
- `GET /api/applications/{id}/status` - Get application status

### Bank Portal
- `POST /api/bank/submit-offer` - Submit bank offer
- `GET /api/bank/leads` - Get available leads
- `GET /api/bank/offers` - Get submitted offers

### Admin Portal
- `GET /api/admin/applications` - Get all applications
- `GET /api/admin/offers` - Get all offers
- `PUT /api/admin/applications/{id}/status` - Update application status

## Security & Compliance

### Data Protection
- Contact details are masked in outbound leads until an offer is submitted
- File uploads are validated and scanned for security threats
- All API endpoints require proper authentication

### Access Control
- Hidden routes are accessible only to users with admin roles
- Feature flags control visibility of different service types
- Role-based access control for all portal features

## Implementation Checklist

### ✅ Completed
- [x] Feature flag system implemented
- [x] Main page updated to focus on POS Financing
- [x] Navigation updated to hide POS Devices and Payment Gateway
- [x] Client application form updated for POS Financing
- [x] Bank offer submission form updated
- [x] File upload system implemented
- [x] API endpoints updated
- [x] Translations updated for both English and Arabic

### 🔄 In Progress
- [ ] Wathiq API integration for business data fetching
- [ ] Auction timer implementation
- [ ] Bank notification system

### 📋 Pending
- [ ] Admin portal updates for POS-specific fields
- [ ] Reporting system for POS Financing leads
- [ ] Escalation system for unopened leads

## Testing

### QA Checklist
- [ ] Enter CR number → Wathiq returns expected fields
- [ ] Form validations fire as expected
- [ ] Application submission creates POS Financing lead
- [ ] Auction timers start correctly
- [ ] Notifications sent to eligible providers
- [ ] Bank portal can submit offers with new fields
- [ ] Admin portal shows lead and offer data
- [ ] Public site shows only POS Financing
- [ ] Hidden routes accessible via direct URL for admin users

### Test Scenarios
1. **Happy Path**: Complete application submission and offer process
2. **Validation**: Test all form validations and error messages
3. **File Upload**: Test various file types and sizes
4. **Access Control**: Test feature flag behavior and role-based access
5. **Edge Cases**: Test boundary values and error conditions

## Deployment Notes

### Environment Variables
- `NEXT_PUBLIC_FEATURE_FLAGS`: Override feature configuration
- `UPLOAD_MAX_SIZE`: Configure maximum file upload size
- `WATHIQ_API_KEY`: API key for Wathiq integration

### Database Changes
- New tables for POS Financing applications
- Updated offer table structure
- New audit trail for file uploads

### Monitoring
- File upload success/failure rates
- API response times
- Error rates and types
- User engagement metrics

## Support & Maintenance

### Common Issues
1. **File Upload Failures**: Check file size and type restrictions
2. **Feature Flag Issues**: Verify configuration file and environment variables
3. **API Errors**: Check authentication and validation logic

### Troubleshooting
- Enable debug logging for feature flags
- Monitor file upload directory permissions
- Check API endpoint response codes
- Verify user role assignments

## Future Enhancements

### Phase 2 Features
- Advanced auction bidding system
- Real-time notifications
- Mobile application support
- Advanced analytics and reporting
- Integration with additional financial institutions

### Technical Improvements
- Microservice architecture
- Real-time WebSocket connections
- Advanced caching strategies
- Performance optimization
- Enhanced security measures

