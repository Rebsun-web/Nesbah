# Business User Creation API Examples

This document provides examples of how to create business users using the existing API endpoint.

## API Endpoint
```
POST /api/admin/users/create-business
```

## Authentication
All requests require an admin token in the cookie header:
```
Cookie: admin_token=YOUR_ADMIN_TOKEN
```

## Method 1: Create with Wathiq API Data

This method fetches business data from the Saudi commercial registration API using a CR National Number.

### cURL Example
```bash
curl -X POST http://localhost:3000/api/admin/users/create-business \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_token=YOUR_ADMIN_TOKEN" \
  -d '{
    "cr_national_number": "4030000001",
    "fetch_from_wathiq": true
  }'
```

### Response
```json
{
  "success": true,
  "message": "Business user created successfully",
  "data": {
    "user_id": 123,
    "trade_name": "Tech Solutions Ltd",
    "cr_national_number": "4030000001",
    "registration_status": "active",
    "wathiq_data_used": true,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

## Method 2: Create Manually

This method creates a business user with manually provided data.

### cURL Example
```bash
curl -X POST http://localhost:3000/api/admin/users/create-business \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_token=YOUR_ADMIN_TOKEN" \
  -d '{
    "fetch_from_wathiq": false,
    "trade_name": "Tech Solutions Ltd",
    "cr_number": "CR123456",
    "cr_national_number": "4030000002",
    "address": "King Fahd Road, Riyadh",
    "sector": "Technology",
    "registration_status": "active",
    "cash_capital": 100000,
    "cr_capital": 150000,
    "city": "Riyadh",
    "contact_person": "Ahmed Al-Rashid",
    "contact_person_number": "+966501234567",
    "has_ecommerce": true,
    "store_url": "https://techsolutions.sa",
    "legal_form": "Limited Liability Company",
    "management_structure": "Board of Directors",
    "contact_info": {
      "phone": "+966501234567",
      "email": "info@techsolutions.sa",
      "website": "www.techsolutions.sa"
    }
  }'
```

### Response
```json
{
  "success": true,
  "message": "Business user created successfully",
  "data": {
    "user_id": 124,
    "trade_name": "Tech Solutions Ltd",
    "cr_national_number": "4030000002",
    "registration_status": "active",
    "wathiq_data_used": false,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

## Required Fields

### For Wathiq Method:
- `cr_national_number` (string): Saudi commercial registration national number
- `fetch_from_wathiq` (boolean): Must be `true`

### For Manual Method:
- `trade_name` (string): Business trade name
- `fetch_from_wathiq` (boolean): Must be `false`

## Optional Fields (Manual Method)

- `cr_number` (string): Commercial registration number
- `cr_national_number` (string): CR national number
- `address` (string): Business address
- `sector` (string): Business sector
- `registration_status` (string): Defaults to "active"
- `cash_capital` (number): Cash capital amount
- `in_kind_capital` (string): In-kind capital
- `contact_info` (object): Contact information
- `store_url` (string): E-commerce store URL
- `legal_form` (string): Legal form of business
- `issue_date_gregorian` (string): Issue date
- `confirmation_date_gregorian` (string): Confirmation date
- `has_ecommerce` (boolean): Whether business has e-commerce
- `management_structure` (string): Management structure
- `management_managers` (array): Array of manager names
- `cr_capital` (number): CR capital amount
- `city` (string): City of operation
- `contact_person` (string): Contact person name
- `contact_person_number` (string): Contact person phone number

## Error Responses

### Missing Required Fields
```json
{
  "success": false,
  "error": "cr_national_number is required when fetching from Wathiq API"
}
```

### Invalid Registration Status
```json
{
  "success": false,
  "error": "Registration status is not active. Cannot proceed."
}
```

### Wathiq API Error
```json
{
  "success": false,
  "error": "Failed to fetch data from Wathiq API"
}
```

### Database Error
```json
{
  "success": false,
  "error": "Failed to create business user"
}
```

## Notes

1. The Wathiq API method requires a valid Saudi commercial registration number
2. Only businesses with "active" registration status can be created
3. The API automatically generates a unique `user_id` for the business user
4. Contact information and management data are stored as JSON
5. All timestamps are in ISO 8601 format
