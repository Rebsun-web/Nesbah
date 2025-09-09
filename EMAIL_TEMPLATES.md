# EmailJS Templates for Nesbah Notification System

## Template 1: Newsletter Subscription Confirmation

**Template ID:** `newsletter_subscription_confirmation`

**Subject:** Welcome to Nesbah Newsletter - Stay Updated on Financing Opportunities

**HTML Content:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Nesbah Newsletter</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1E1851 0%, #2D1B69 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .logo { width: 120px; margin-bottom: 20px; }
        .button { display: inline-block; background: #1E1851; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://nesbah.com.sa/logo/NewNesbahLogo.png" alt="Nesbah Logo" class="logo">
            <h1>Welcome to Nesbah!</h1>
            <p>Thank you for subscribing to our newsletter</p>
        </div>
        <div class="content">
            <h2>Dear {{user_email}},</h2>
            
            <p>Welcome to the Nesbah community! We're thrilled to have you join us on this journey to revolutionize business financing in Saudi Arabia.</p>
            
            <h3>What you can expect from our newsletter:</h3>
            <ul>
                <li><strong>Latest Financing Opportunities:</strong> Stay updated on new POS financing options and competitive rates</li>
                <li><strong>Market Insights:</strong> Get expert analysis on business financing trends in Saudi Arabia</li>
                <li><strong>Success Stories:</strong> Learn from businesses that have successfully secured financing through our platform</li>
                <li><strong>Platform Updates:</strong> Be the first to know about new features and improvements</li>
                <li><strong>Exclusive Offers:</strong> Access special financing deals available only to our subscribers</li>
            </ul>
            
            <p>Our newsletter is sent weekly and contains valuable information to help your business grow and succeed.</p>
            
            <div style="text-align: center;">
                <a href="https://nesbah.com.sa" class="button">Explore Our Platform</a>
            </div>
            
            <h3>About Nesbah</h3>
            <p>Nesbah is Saudi Arabia's leading platform for competitive business financing. We connect businesses with multiple banks to secure the best financing terms for POS systems, equipment, and other business needs.</p>
            
            <p>If you have any questions or need assistance, feel free to reach out to our support team at <a href="mailto:admin@nesbah.com.sa">admin@nesbah.com.sa</a></p>
        </div>
        <div class="footer">
            <p>© 2025 Nesbah. All rights reserved.</p>
            <p>King Fahad Road 509, Riyadh, Saudi Arabia</p>
            <p><a href="https://nesbah.com.sa/unsubscribe?email={{user_email}}">Unsubscribe</a> | <a href="https://nesbah.com.sa/privacy">Privacy Policy</a></p>
        </div>
    </div>
</body>
</html>
```

**Template Variables:**
- `{{user_email}}` - The subscriber's email address

---

## Template 2: Business User Registration Welcome

**Template ID:** `business_user_registration_welcome`

**Subject:** Welcome to Nesbah - Your Business Financing Journey Starts Here

**HTML Content:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Nesbah - Business Registration</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1E1851 0%, #2D1B69 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .logo { width: 120px; margin-bottom: 20px; }
        .button { display: inline-block; background: #1E1851; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .info-box { background: white; border-left: 4px solid #1E1851; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://nesbah.com.sa/logo/NewNesbahLogo.png" alt="Nesbah Logo" class="logo">
            <h1>Welcome to Nesbah!</h1>
            <p>Your business registration is complete</p>
        </div>
        <div class="content">
            <h2>Dear {{business_name}},</h2>
            
            <p>Congratulations! Your business has been successfully registered on the Nesbah platform. You're now ready to access competitive financing opportunities from multiple banks across Saudi Arabia.</p>
            
            <div class="info-box">
                <h3>Your Business Information</h3>
                <p><strong>Business Name:</strong> {{business_name}}</p>
                <p><strong>CR Number:</strong> {{cr_number}}</p>
                <p><strong>Registration Status:</strong> {{registration_status}}</p>
                <p><strong>Email:</strong> {{user_email}}</p>
            </div>
            
            <h3>What's Next?</h3>
            <ol>
                <li><strong>Complete Your Profile:</strong> Add additional business details to improve your financing opportunities</li>
                <li><strong>Submit Your First Application:</strong> Apply for POS financing and let banks compete for your business</li>
                <li><strong>Review Offers:</strong> Compare competitive offers from multiple banks</li>
                <li><strong>Choose the Best Deal:</strong> Select the financing option that works best for your business</li>
            </ol>
            
            <h3>Key Benefits of Using Nesbah:</h3>
            <ul>
                <li>✅ <strong>Competitive Rates:</strong> Multiple banks compete for your business</li>
                <li>✅ <strong>Transparent Process:</strong> No hidden fees or surprises</li>
                <li>✅ <strong>Fast Processing:</strong> Get offers within 48 hours</li>
                <li>✅ <strong>Expert Support:</strong> Our team is here to help you succeed</li>
            </ul>
            
            <div style="text-align: center;">
                <a href="https://nesbah.com.sa/dashboard" class="button">Access Your Dashboard</a>
            </div>
            
            <h3>Need Help?</h3>
            <p>Our support team is available to assist you with any questions about the platform or the financing process. Contact us at:</p>
            <ul>
                <li>📧 Email: <a href="mailto:admin@nesbah.com.sa">admin@nesbah.com.sa</a></li>
                <li>📞 Phone: Available through our support portal</li>
            </ul>
            
            <p>We're excited to help your business grow and succeed!</p>
        </div>
        <div class="footer">
            <p>© 2025 Nesbah. All rights reserved.</p>
            <p>King Fahad Road 509, Riyadh, Saudi Arabia</p>
            <p><a href="https://nesbah.com.sa/privacy">Privacy Policy</a> | <a href="https://nesbah.com.sa/terms">Terms of Service</a></p>
        </div>
    </div>
</body>
</html>
```

**Template Variables:**
- `{{business_name}}` - The business trade name
- `{{cr_number}}` - Commercial registration number
- `{{registration_status}}` - Registration status (active, pending, etc.)
- `{{user_email}}` - The business user's email address

---

## Template 3: Application Submission Confirmation

**Template ID:** `application_submission_confirmation`

**Subject:** Application Submitted Successfully - Your Auction is Live!

**HTML Content:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Submitted - Nesbah</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1E1851 0%, #2D1B69 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .logo { width: 120px; margin-bottom: 20px; }
        .button { display: inline-block; background: #1E1851; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .info-box { background: white; border-left: 4px solid #1E1851; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .auction-box { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://nesbah.com.sa/logo/NewNesbahLogo.png" alt="Nesbah Logo" class="logo">
            <h1>Application Submitted Successfully!</h1>
            <p>Your financing auction is now live</p>
        </div>
        <div class="content">
            <h2>Dear {{business_name}},</h2>
            
            <p>Great news! Your POS financing application has been successfully submitted and is now live on our platform. Banks are already reviewing your application and will start submitting competitive offers.</p>
            
            <div class="auction-box">
                <h3>🎯 Your Auction is Live!</h3>
                <p><strong>Application ID:</strong> {{application_id}}</p>
                <p><strong>Submitted:</strong> {{submitted_date}}</p>
                <p><strong>Auction Ends:</strong> {{auction_end_date}}</p>
                <p><strong>Time Remaining:</strong> 48 hours</p>
            </div>
            
            <div class="info-box">
                <h3>Application Details</h3>
                <p><strong>Business:</strong> {{business_name}}</p>
                <p><strong>City of Operation:</strong> {{city_of_operation}}</p>
                <p><strong>POS Devices:</strong> {{number_of_pos_devices}}</p>
                <p><strong>Requested Amount:</strong> SAR {{requested_amount}}</p>
                <p><strong>Repayment Period:</strong> {{repayment_period}} months</p>
            </div>
            
            <h3>What Happens Next?</h3>
            <ol>
                <li><strong>Bank Review (0-24 hours):</strong> Banks analyze your application and business profile</li>
                <li><strong>Offer Submission (24-48 hours):</strong> Banks submit competitive financing offers</li>
                <li><strong>Auction Completion:</strong> You'll receive all offers when the auction ends</li>
                <li><strong>Decision Time:</strong> Review and select the best offer for your business</li>
            </ol>
            
            <h3>How the Auction Works:</h3>
            <ul>
                <li>✅ <strong>Multiple Banks Compete:</strong> Banks see your application and submit their best offers</li>
                <li>✅ <strong>Transparent Process:</strong> All offers are clearly presented with terms and conditions</li>
                <li>✅ <strong>No Obligation:</strong> You're not required to accept any offer</li>
                <li>✅ <strong>Best Rates:</strong> Competition ensures you get the most competitive financing terms</li>
            </ul>
            
            <div style="text-align: center;">
                <a href="https://nesbah.com.sa/dashboard/applications/{{application_id}}" class="button">Track Your Application</a>
            </div>
            
            <h3>Important Reminders:</h3>
            <ul>
                <li>📅 <strong>Check Back Regularly:</strong> New offers may appear throughout the 48-hour period</li>
                <li>📧 <strong>Email Notifications:</strong> You'll receive updates when new offers are submitted</li>
                <li>⏰ <strong>Don't Miss the Deadline:</strong> The auction ends exactly 48 hours from submission</li>
            </ul>
            
            <p>We'll notify you as soon as the auction ends with all the offers you've received. Good luck!</p>
        </div>
        <div class="footer">
            <p>© 2025 Nesbah. All rights reserved.</p>
            <p>King Fahad Road 509, Riyadh, Saudi Arabia</p>
            <p>Questions? Contact us at <a href="mailto:admin@nesbah.com.sa">admin@nesbah.com.sa</a></p>
        </div>
    </div>
</body>
</html>
```

**Template Variables:**
- `{{business_name}}` - The business trade name
- `{{application_id}}` - Unique application identifier
- `{{submitted_date}}` - Date and time of submission
- `{{auction_end_date}}` - Date and time when auction ends
- `{{city_of_operation}}` - City where business operates
- `{{number_of_pos_devices}}` - Number of POS devices requested
- `{{requested_amount}}` - Requested financing amount
- `{{repayment_period}}` - Preferred repayment period in months

---

## Template 4: Auction Window Expiration Notification

**Template ID:** `auction_window_expiration`

**Subject:** Auction Results Available - Check Your Offers Now!

**HTML Content:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auction Results - Nesbah</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1E1851 0%, #2D1B69 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .logo { width: 120px; margin-bottom: 20px; }
        .button { display: inline-block; background: #1E1851; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .info-box { background: white; border-left: 4px solid #1E1851; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .results-box { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; }
        .no-offers-box { background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); color: white; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://nesbah.com.sa/logo/NewNesbahLogo.png" alt="Nesbah Logo" class="logo">
            <h1>Auction Results Available!</h1>
            <p>Your financing auction has ended</p>
        </div>
        <div class="content">
            <h2>Dear {{business_name}},</h2>
            
            <p>Your 48-hour financing auction has officially ended! It's time to review the results and see what competitive offers you've received from our partner banks.</p>
            
            <div class="info-box">
                <h3>Auction Summary</h3>
                <p><strong>Application ID:</strong> {{application_id}}</p>
                <p><strong>Submitted:</strong> {{submitted_date}}</p>
                <p><strong>Auction Ended:</strong> {{auction_end_date}}</p>
                <p><strong>Business:</strong> {{business_name}}</p>
                <p><strong>Requested Amount:</strong> SAR {{requested_amount}}</p>
            </div>
            
            {{#if has_offers}}
            <div class="results-box">
                <h3>🎉 Congratulations!</h3>
                <p><strong>{{offers_received}} Competitive Offers Received</strong></p>
                <p>Banks have submitted {{offers_received}} financing offers for your business. This is great news - you now have multiple options to choose from!</p>
            </div>
            
            <h3>What You Need to Do Next:</h3>
            <ol>
                <li><strong>Review All Offers:</strong> Log into your dashboard to see detailed terms from each bank</li>
                <li><strong>Compare Terms:</strong> Look at interest rates, repayment periods, and additional benefits</li>
                <li><strong>Ask Questions:</strong> Contact banks directly if you need clarification on any terms</li>
                <li><strong>Make Your Decision:</strong> Select the offer that best fits your business needs</li>
            </ol>
            
            <h3>Why This is Great News:</h3>
            <ul>
                <li>✅ <strong>Multiple Options:</strong> You have {{offers_received}} different financing solutions to choose from</li>
                <li>✅ <strong>Competitive Rates:</strong> Banks competed for your business, ensuring better terms</li>
                <li>✅ <strong>Flexible Terms:</strong> Different repayment options to suit your cash flow</li>
                <li>✅ <strong>No Pressure:</strong> Take your time to review and make the best decision</li>
            </ul>
            
            <div style="text-align: center;">
                <a href="https://nesbah.com.sa/dashboard/applications/{{application_id}}/offers" class="button">View Your Offers</a>
            </div>
            {{else}}
            <div class="no-offers-box">
                <h3>📋 No Offers Received</h3>
                <p>Unfortunately, no banks submitted offers during the auction period.</p>
                <p>Don't worry - this happens sometimes and there are still options available!</p>
            </div>
            
            <h3>What This Means:</h3>
            <ul>
                <li>📊 <strong>Market Conditions:</strong> Banks may be more selective during certain periods</li>
                <li>📈 <strong>Business Profile:</strong> Your application might benefit from additional documentation</li>
                <li>🔄 <strong>Second Chance:</strong> You can resubmit your application with improvements</li>
            </ul>
            
            <h3>Next Steps:</h3>
            <ol>
                <li><strong>Review Your Application:</strong> Check if any additional information could strengthen your profile</li>
                <li><strong>Contact Our Team:</strong> Our experts can help you improve your application</li>
                <li><strong>Resubmit:</strong> Apply again with enhanced documentation and business details</li>
                <li><strong>Alternative Options:</strong> Explore other financing solutions we offer</li>
            </ol>
            
            <div style="text-align: center;">
                <a href="https://nesbah.com.sa/dashboard/applications/{{application_id}}" class="button">Review Application</a>
                <a href="https://nesbah.com.sa/contact" class="button" style="background: #6c757d; margin-left: 10px;">Get Help</a>
            </div>
            {{/if}}
            
            <h3>Need Assistance?</h3>
            <p>Our support team is here to help you understand your options and make the best decision for your business:</p>
            <ul>
                <li>📧 Email: <a href="mailto:admin@nesbah.com.sa">admin@nesbah.com.sa</a></li>
                <li>💬 Live Chat: Available on our website</li>
                <li>📞 Phone Support: Contact us through your dashboard</li>
            </ul>
            
            <p>Thank you for choosing Nesbah for your business financing needs!</p>
        </div>
        <div class="footer">
            <p>© 2025 Nesbah. All rights reserved.</p>
            <p>King Fahad Road 509, Riyadh, Saudi Arabia</p>
            <p><a href="https://nesbah.com.sa/privacy">Privacy Policy</a> | <a href="https://nesbah.com.sa/terms">Terms of Service</a></p>
        </div>
    </div>
</body>
</html>
```

**Template Variables:**
- `{{business_name}}` - The business trade name
- `{{application_id}}` - Unique application identifier
- `{{submitted_date}}` - Date and time of submission
- `{{auction_end_date}}` - Date and time when auction ended
- `{{requested_amount}}` - Requested financing amount
- `{{offers_received}}` - Number of offers received (0 if no offers)
- `{{has_offers}}` - Boolean indicating if offers were received
- `{{city_of_operation}}` - City where business operates

---

## Template 5: New Application Lead for Bank Users

**Template ID:** `new_application_lead_bank`

**Subject:** New POS Financing Application Available - {{business_name}} ({{application_id}})

**HTML Content:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Application Lead - Nesbah</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1E1851 0%, #2D1B69 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .logo { width: 120px; margin-bottom: 20px; }
        .button { display: inline-block; background: #1E1851; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .info-box { background: white; border-left: 4px solid #1E1851; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .urgent-box { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://nesbah.com.sa/logo/NewNesbahLogo.png" alt="Nesbah Logo" class="logo">
            <h1>New Application Lead Available!</h1>
            <p>POS Financing Opportunity</p>
        </div>
        <div class="content">
            <div class="urgent-box">
                <h3>🚨 Time-Sensitive Opportunity</h3>
                <p><strong>Auction Ends: {{auction_end_date}}</strong></p>
                <p>Submit your competitive offer before the deadline!</p>
            </div>
            
            <h2>Business Information</h2>
            <div class="info-box">
                <h3>{{business_name}}</h3>
                <p><strong>Application ID:</strong> {{application_id}}</p>
                <p><strong>CR Number:</strong> {{business_cr_number}}</p>
                <p><strong>Legal Form:</strong> {{business_legal_form}}</p>
                <p><strong>City:</strong> {{business_city}}</p>
                <p><strong>City of Operation:</strong> {{city_of_operation}}</p>
            </div>
            
            <h2>Financing Requirements</h2>
            <div class="info-box">
                <p><strong>Requested Amount:</strong> SAR {{requested_amount}}</p>
                <p><strong>Repayment Period:</strong> {{repayment_period}} months</p>
                <p><strong>POS Devices:</strong> {{number_of_pos_devices}}</p>
            </div>
            
            <div class="highlight">
                <h3>💡 Why This is a Great Opportunity:</h3>
                <ul>
                    <li>✅ <strong>Verified Business:</strong> All business information has been verified through Wathiq API</li>
                    <li>✅ <strong>Active Registration:</strong> Business is in good standing with Saudi authorities</li>
                    <li>✅ <strong>Clear Requirements:</strong> Specific financing needs and repayment preferences</li>
                    <li>✅ <strong>Competitive Environment:</strong> Multiple banks will compete for this business</li>
                </ul>
            </div>
            
            <h3>How to Submit Your Offer:</h3>
            <ol>
                <li><strong>Log into Your Bank Dashboard:</strong> Access your Nesbah bank portal</li>
                <li><strong>Review Application Details:</strong> Get complete business information and requirements</li>
                <li><strong>Prepare Your Offer:</strong> Calculate competitive rates and terms</li>
                <li><strong>Submit Before Deadline:</strong> Ensure your offer is submitted before {{auction_end_date}}</li>
            </ol>
            
            <div style="text-align: center;">
                <a href="https://nesbah.com.sa/bank/dashboard/applications/{{application_id}}" class="button">View Full Application</a>
            </div>
            
            <h3>Important Reminders:</h3>
            <ul>
                <li>⏰ <strong>Deadline:</strong> Offers must be submitted before {{auction_end_date}}</li>
                <li>🏆 <strong>Competition:</strong> Other banks are also reviewing this application</li>
                <li>📊 <strong>Transparency:</strong> All offers are presented fairly to the business</li>
                <li>💼 <strong>Quality Lead:</strong> This business has been pre-screened and verified</li>
            </ul>
            
            <h3>Need Support?</h3>
            <p>Our team is here to help you with any questions about this application or the submission process:</p>
            <ul>
                <li>📧 Email: <a href="mailto:admin@nesbah.com.sa">admin@nesbah.com.sa</a></li>
                <li>💬 Live Chat: Available on your bank dashboard</li>
                <li>📞 Phone Support: Contact us through your portal</li>
            </ul>
            
            <p>Don't miss this opportunity to grow your portfolio with a qualified business!</p>
        </div>
        <div class="footer">
            <p>© 2025 Nesbah. All rights reserved.</p>
            <p>King Fahad Road 509, Riyadh, Saudi Arabia</p>
            <p><a href="https://nesbah.com.sa/bank/dashboard">Bank Dashboard</a> | <a href="https://nesbah.com.sa/privacy">Privacy Policy</a></p>
        </div>
    </div>
</body>
</html>
```

**Template Variables:**
- `{{to_email}}` - Bank user's email address
- `{{business_name}}` - Business trade name
- `{{application_id}}` - Unique application identifier
- `{{city_of_operation}}` - City where business operates
- `{{number_of_pos_devices}}` - Number of POS devices requested
- `{{requested_amount}}` - Requested financing amount
- `{{repayment_period}}` - Preferred repayment period in months
- `{{auction_end_date}}` - Date and time when auction ends
- `{{business_cr_number}}` - Business CR number
- `{{business_city}}` - Business city
- `{{business_legal_form}}` - Business legal form

---

## Template Configuration Notes

### EmailJS Setup Instructions:

1. **Create Templates in EmailJS Dashboard:**
   - Log into your EmailJS account
   - Go to Email Templates section
   - Create 4 new templates with the IDs specified above
   - Copy the HTML content for each template
   - Set the subject lines as specified

2. **Template Variables:**
   - Each template uses specific variables that will be populated by the application
   - Make sure to configure these variables in EmailJS dashboard
   - Variables are enclosed in double curly braces: `{{variable_name}}`

3. **Testing:**
   - Use EmailJS test feature to verify templates render correctly
   - Test with sample data to ensure all variables are populated
   - Check email rendering across different email clients

4. **Environment Variables:**
   - Add the template IDs to your environment variables
   - Update the EmailJS service configuration
   - Ensure all required keys are properly set

### Template IDs for Environment Variables:
```bash
EMAILJS_NEWSLETTER_SUBSCRIPTION_TEMPLATE_ID=newsletter_subscription_confirmation
EMAILJS_BUSINESS_REGISTRATION_TEMPLATE_ID=business_user_registration_welcome
EMAILJS_APPLICATION_SUBMITTED_TEMPLATE_ID=application_submission_confirmation
EMAILJS_AUCTION_EXPIRATION_TEMPLATE_ID=auction_window_expiration
```
