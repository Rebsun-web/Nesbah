# Admin User Creation Guide

This guide explains the new admin user creation system that follows the same pattern as business user registration, ensuring consistency across the platform.

## Overview

The admin user creation system now supports three types of users:
1. **Business Users** - Full Wathiq API integration with comprehensive business data (no login credentials)
2. **Bank Users** - Simplified structure with bank-specific fields and login credentials
3. **Individual Users** - Basic user structure with login credentials

## Business User Creation

### API Endpoints

#### 1. Individual Business User Creation
**Endpoint:** `POST /api/admin/users/create-business`

**Features:**
- Full Wathiq API integration (same as registration)
- Manual field override capability
- Comprehensive business data structure
- **No login credentials** - business data only

**Required Fields:**
- `cr_national_number` - Required when `fetch_from_wathiq = true`
- `trade_name` - Required when `fetch_from_wathiq = false`

**Optional Fields (can be provided manually or fetched from Wathiq):**
- `cr_number`
- `address`
- `sector`
- `registration_status`
- `cash_capital`
- `in_kind_capital`
- `contact_info`
- `store_url`
- `form_name`
- `issue_date_gregorian`
- `confirmation_date_gregorian`
- `has_ecommerce`
- `management_structure`
- `management_managers`
- `cr_capital`
- `city`
- `contact_person`
- `contact_person_number`

**Configuration:**
- `fetch_from_wathiq` - Boolean flag (default: true)

**Example Request:**
```json
{
  "cr_national_number": "1234567890",
  "fetch_from_wathiq": true
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Business user created successfully",
  "data": {
    "user_id": 123,
    "trade_name": "Example Business",
    "cr_national_number": "1234567890",
    "registration_status": "active",
    "wathiq_data_used": true,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 2. Bulk Business User Creation
**Endpoint:** `POST /api/admin/users/bulk`

**Features:**
- Bulk creation of multiple business users
- Same comprehensive field structure as individual creation
- Error handling for partial failures
- **No login credentials** - business data only

**Request Structure:**
```json
{
  "operation": "create",
  "user_type": "business",
  "users": [
    {
      "trade_name": "Business One",
      "cr_national_number": "1234567890",
      "sector": "Technology",
      "city": "Riyadh"
    },
    {
      "trade_name": "Business Two",
      "cr_national_number": "0987654321",
      "sector": "Retail",
      "city": "Jeddah"
    }
  ]
}
```

## Bank User Creation

### API Endpoints

#### 1. Individual Bank User Creation
**Endpoint:** `POST /api/admin/users/create-bank`

**Features:**
- Simplified structure focused on bank-specific fields
- **Includes login credentials** (email and password)
- No Wathiq API integration needed
- Basic bank user management

**Required Fields:**
- `email` - User email address
- `password` - User password
- `entity_name` - Bank/entity name

**Optional Fields:**
- `credit_limit` - Default: 10000.00
- `contact_person` - Contact person name
- `contact_person_number` - Contact person phone number

**Example Request:**
```json
{
  "email": "bank@example.com",
  "password": "securepassword123",
  "entity_name": "Example Bank",
  "credit_limit": 50000.00,
  "contact_person": "John Doe",
  "contact_person_number": "+966501234567"
}
```

#### 2. Bulk Bank User Creation
**Endpoint:** `POST /api/admin/users/bulk`

**Request Structure:**
```json
{
  "operation": "create",
  "user_type": "bank",
  "users": [
    {
      "email": "bank1@example.com",
      "password": "password123",
      "entity_name": "Bank One",
      "credit_limit": 25000.00
    },
    {
      "email": "bank2@example.com",
      "password": "password456",
      "entity_name": "Bank Two",
      "credit_limit": 35000.00
    }
  ]
}
```

## Individual User Creation

### Bulk Individual User Creation
**Endpoint:** `POST /api/admin/users/bulk`

**Features:**
- **Includes login credentials** (email and password)
- Basic user structure with first and last name

**Request Structure:**
```json
{
  "operation": "create",
  "user_type": "individual",
  "users": [
    {
      "email": "individual1@example.com",
      "password": "password123",
      "first_name": "John",
      "last_name": "Doe"
    },
    {
      "email": "individual2@example.com",
      "password": "password456",
      "first_name": "Jane",
      "last_name": "Smith"
    }
  ]
}
```

## Database Structure

### Business Users Table
The `business_users` table includes all fields that would be populated from the Wathiq API:

```sql
CREATE TABLE business_users (
    user_id SERIAL PRIMARY KEY,
    cr_national_number VARCHAR(50) UNIQUE NOT NULL,
    cr_number VARCHAR(50),
    trade_name VARCHAR(255) NOT NULL,
    address TEXT,
    sector VARCHAR(255),
    registration_status VARCHAR(20) DEFAULT 'active',
    cash_capital DECIMAL(15,2),
    in_kind_capital DECIMAL(15,2),
    contact_info JSONB,
    store_url VARCHAR(500),
    form_name VARCHAR(255),
    issue_date_gregorian DATE,
    confirmation_date_gregorian DATE,
    has_ecommerce BOOLEAN DEFAULT false,
    management_structure VARCHAR(255),
    management_managers JSONB,
    cr_capital DECIMAL(15,2),
    city VARCHAR(100),
    contact_person VARCHAR(255),
    contact_person_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Bank Users Table
The `bank_users` table has a simplified structure:

```sql
CREATE TABLE bank_users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    credit_limit DECIMAL(15,2) DEFAULT 10000.00,
    contact_person VARCHAR(255),
    contact_person_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Key Features

### 1. Wathiq API Integration
- Business users can be created with full Wathiq API data
- Automatic field population from official business registry
- Manual override capability for specific fields
- Validation of registration status

### 2. Flexible Creation Options
- Individual user creation with detailed control
- Bulk user creation for efficiency
- Support for both API-fetched and manual data

### 3. User Type Differentiation
- **Business Users**: No login credentials, business data only
- **Bank Users**: Include login credentials and bank-specific data
- **Individual Users**: Include login credentials and personal data

### 4. Error Handling
- Comprehensive validation of required fields
- Partial success handling for bulk operations
- Detailed error messages for troubleshooting

### 5. Audit Logging
- All admin actions are logged in `admin_audit_log`
- Detailed information about creation parameters
- Tracking of Wathiq API usage

### 6. Security
- Password hashing using bcrypt (for bank and individual users)
- Input validation and sanitization
- Transaction-based operations for data integrity

## Usage Examples

### Creating a Business User with Wathiq Data
```javascript
const response = await fetch('/api/admin/users/create-business', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cr_national_number: '1234567890',
    fetch_from_wathiq: true
  })
});
```

### Creating a Business User with Manual Data
```javascript
const response = await fetch('/api/admin/users/create-business', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    trade_name: 'Manual Business',
    sector: 'Technology',
    city: 'Riyadh',
    fetch_from_wathiq: false
  })
});
```

### Creating a Bank User
```javascript
const response = await fetch('/api/admin/users/create-bank', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'bank@example.com',
    password: 'securepassword123',
    entity_name: 'Example Bank',
    credit_limit: 50000.00
  })
});
```

### Bulk Business User Creation
```javascript
const response = await fetch('/api/admin/users/bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operation: 'create',
    user_type: 'business',
    users: [
      {
        trade_name: 'Business One',
        cr_national_number: '1234567890',
        sector: 'Technology'
      },
      {
        trade_name: 'Business Two',
        cr_national_number: '0987654321',
        sector: 'Retail'
      }
    ]
  })
});
```

## Best Practices

1. **Business Users**: Focus on business data only, no login credentials needed
2. **Bank/Individual Users**: Always include strong passwords and valid emails
3. **Validate input data** before sending to the API
4. **Handle API errors gracefully** in your frontend
5. **Log all admin actions** for audit purposes
6. **Use bulk operations** when creating multiple users
7. **Test with both Wathiq and manual data** to ensure flexibility

## Troubleshooting

### Common Issues

1. **Wathiq API Errors**
   - Check if the CR number is valid
   - Verify API key configuration
   - Ensure network connectivity

2. **Database Errors**
   - Check for duplicate CR numbers (business users)
   - Check for duplicate email addresses (bank/individual users)
   - Verify required fields are provided
   - Ensure proper transaction handling

3. **Validation Errors**
   - Review required field requirements
   - Check data format and types
   - Verify user type specifications

### Error Response Format
```json
{
  "success": false,
  "error": "Detailed error message"
}
```

## Important Notes

- **Business users** are created without login credentials - they represent business entities only
- **Bank and individual users** include login credentials for system access
- Business users can later be linked to login accounts through a separate process
- All business users maintain the same comprehensive data structure as registration
- Bank users maintain simplified structure appropriate for their role

This system ensures that all business users have the same comprehensive data structure as those created through the registration process, while maintaining simplified structures for bank and individual users as appropriate.
