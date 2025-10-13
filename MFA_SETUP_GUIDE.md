# MFA Setup Guide for Nesbah Admin Portal

This guide will help you implement Multi-Factor Authentication (MFA) for admin users in your Nesbah platform.

## 1. Install Required Dependencies

Run the following command to install the required packages:

```bash
npm install speakeasy qrcode
```

## 2. Database Migration

Run the SQL script to add MFA columns to your users table:

```bash
# Using psql (adjust connection details as needed)
psql -h your_host -d your_database -U your_user -f add-mfa-columns.sql

# Or using your database management tool, run the contents of add-mfa-columns.sql
```

## 3. Files Added

The following files have been created for MFA functionality:

### Core MFA Logic
- `src/lib/auth/mfa-utils.js` - MFA utility functions (TOTP generation, QR codes)
- `src/lib/auth/admin-auth.js` - Updated with MFA methods

### API Endpoints
- `src/app/api/admin/mfa/setup/route.jsx` - Setup MFA for admin user
- `src/app/api/admin/mfa/verify/route.jsx` - Verify MFA token during setup
- `src/app/api/admin/mfa/status/route.jsx` - Check MFA status

### UI Components
- `src/components/admin/MFASettings.jsx` - MFA settings component for admin panel

### Updated Files
- `src/app/api/auth/unified-login/route.jsx` - Updated to support MFA during login

## 4. How to Use

### For Admin Users:

1. **Access MFA Settings**: Navigate to the admin panel and access the MFA settings
2. **Enable MFA**: Click "Enable MFA" to start the setup process
3. **Scan QR Code**: Use an authenticator app (Google Authenticator, Authy, etc.) to scan the QR code
4. **Save Backup Codes**: Store the backup codes in a secure location
5. **Verify Setup**: Enter a code from your authenticator app to complete setup
6. **Login with MFA**: Future logins will require both password and MFA token

### For Developers:

1. **Add MFA Settings to Admin Panel**: Import and use the `MFASettings` component in your admin interface
2. **Update Login Flow**: The unified login already supports MFA - just ensure your frontend handles the `requiresMFA` response

## 5. Integration Example

To add MFA settings to your admin panel, add this to your admin settings page:

```jsx
import MFASettings from '@/components/admin/MFASettings';

function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            <h1>Admin Settings</h1>
            <MFASettings />
            {/* Other settings components */}
        </div>
    );
}
```

## 6. Frontend Login Flow

When a user requires MFA, the login API will return:

```json
{
    "success": false,
    "error": "MFA token required",
    "requiresMFA": true,
    "user": {
        "user_id": 123,
        "email": "admin@example.com"
    }
}
```

Your frontend should then prompt for the MFA token and include it in a subsequent login request.

## 7. Security Notes

- MFA secrets are stored encrypted in the database
- Backup codes should be stored securely by users
- MFA tokens have a time window tolerance for clock skew
- Failed MFA attempts are logged for security monitoring

## 8. Testing

1. Create an admin user account
2. Enable MFA through the admin panel
3. Test login with correct password + MFA token
4. Test login with correct password + incorrect MFA token
5. Verify backup codes work as expected

## 9. Troubleshooting

**"Failed to setup MFA"**: Ensure the required npm packages are installed and database columns exist

**"Invalid verification token"**: Check that the authenticator app is synchronized with the correct time

**Database errors**: Verify the MFA columns were added successfully to the users table

**Import errors**: Make sure all file paths are correct and the MFA utility files exist

## 10. Next Steps

- Consider implementing backup code usage for emergency access
- Add MFA requirement enforcement for all admin accounts
- Implement MFA disable functionality with proper verification
- Add audit logging for MFA-related actions

The MFA implementation is now ready for use! Admin users can enable two-factor authentication to secure their accounts.

