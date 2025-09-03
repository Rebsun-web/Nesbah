import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

export async function GET(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session using session manager
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        // Get CR number from query parameters
        const { searchParams } = new URL(req.url);
        const cr_number = searchParams.get('cr_number');
        
        if (!cr_number) {
            return NextResponse.json({ 
                success: false, 
                error: 'CR Number is required' 
            }, { status: 400 });
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_validate_cr_route.jsx_GET');
        
        try {
            // Debug: Show what CR numbers exist in the database
            const debugQuery = `
                SELECT bu.cr_number, bu.cr_national_number, bu.trade_name
                FROM business_users bu
                LIMIT 10
            `;
            
            const debugResult = await client.query(debugQuery);
            console.log(`🔍 Debug: Found ${debugResult.rows.length} business users in database:`);
            debugResult.rows.forEach(row => {
                console.log(`  - CR: ${row.cr_number}, National: ${row.cr_national_number}, Name: ${row.trade_name}`);
            });
            
            // First check if business user exists
            const businessUserQuery = `
                SELECT 
                    bu.user_id,
                    bu.cr_number,
                    bu.cr_national_number,
                    bu.trade_name,
                    bu.city,
                    bu.cr_capital,
                    bu.legal_form,
                    bu.registration_status,
                    bu.contact_person,
                    bu.contact_person_number,
                    bu.address,
                    bu.sector,
                    bu.in_kind_capital,
                    bu.avg_capital,
                    bu.headquarter_district_name,
                    bu.headquarter_street_name,
                    bu.headquarter_building_number,
                    bu.is_verified,
                    bu.verification_date,
                    bu.issue_date_gregorian,
                    bu.confirmation_date_gregorian,
                    bu.activities,
                    bu.has_ecommerce,
                    bu.store_url,
                    bu.cash_capital,
                    bu.management_structure,
                    bu.management_managers,
                    bu.contact_info,
                    u.email as business_email
                FROM business_users bu
                JOIN users u ON bu.user_id = u.user_id
                WHERE bu.cr_number = $1 OR bu.cr_national_number = $1 OR bu.cr_number = 'CR' || $1 OR bu.cr_national_number = 'CR' || $1
                LIMIT 1
            `;
            
            const businessUserResult = await client.query(businessUserQuery, [cr_number]);
            
            if (businessUserResult.rows.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: `No business found with CR Number: ${cr_number}. Please check the CR Number format and try again.`
                });
            }
            
            const businessUser = businessUserResult.rows[0];
            console.log(`✅ Found business user: ${businessUser.trade_name}`);
            
            // Now check if they have any applications
            const applicationQuery = `
                SELECT 
                    pa.application_id,
                    pa.status,
                    pa.auction_end_time,
                    pa.offers_count,
                    pa.preferred_repayment_period_months,
                    pa.requested_financing_amount,
                    pa.number_of_pos_devices,
                    pa.pos_provider_name,
                    pa.avg_monthly_pos_sales,
                    pa.notes,
                    pa.submitted_at,
                    pa.contact_person,
                    pa.contact_person_number,
                    pa.city as application_city,
                    pa.cr_capital as application_cr_capital,
                    pa.legal_form as application_legal_form,
                    pa.registration_status as application_registration_status
                FROM pos_application pa
                WHERE pa.user_id = $1
                ORDER BY pa.submitted_at DESC
                LIMIT 1
            `;
            
            const applicationResult = await client.query(applicationQuery, [businessUser.user_id]);
            
            if (applicationResult.rows.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: `Business user ${businessUser.trade_name} (CR: ${businessUser.cr_number}) exists but has not submitted any applications yet.`
                });
            }
            
            const application = applicationResult.rows[0];
            console.log(`✅ Found application: ${application.application_id} with status: ${application.status}`);
            
            // Calculate the actual auction status based on time and offers (same logic as frontend)
            let actualStatus = application.status;
            let timeRemaining = null;
            
            if (application.auction_end_time) {
                const now = new Date();
                const auctionEnd = new Date(application.auction_end_time);
                timeRemaining = auctionEnd.getTime() - now.getTime();
                
                console.log(`🕐 Auction Timing: Now: ${now.toISOString()}, End: ${auctionEnd.toISOString()}, Remaining: ${timeRemaining}ms`);
                console.log(`📊 Application Details: Offers: ${application.offers_count}, Status: ${application.status}`);
                
                // Determine actual status based on time and offers
                if (timeRemaining > 0 && application.offers_count === 0) {
                    actualStatus = 'live_auction';
                } else if (timeRemaining > 0 && application.offers_count > 0) {
                    actualStatus = 'live_auction';
                } else if (timeRemaining <= 0 && application.offers_count > 0) {
                    actualStatus = 'completed';
                } else if (timeRemaining <= 0 && application.offers_count === 0) {
                    actualStatus = 'ignored';
                }
            }
            
            console.log(`🔍 Status Analysis: DB Status: ${application.status}, Calculated Status: ${actualStatus}, Time Remaining: ${timeRemaining ? Math.round(timeRemaining / (1000 * 60 * 60)) + 'h' : 'N/A'}`);
            
            // Check if application is in live auction status
            if (actualStatus !== 'live_auction') {
                return NextResponse.json({
                    success: false,
                    error: `Business application is not in live auction status. Current status: ${actualStatus}`
                });
            }
            
            // Check if auction has expired
            if (application.auction_end_time && application.auction_end_time < new Date()) {
                return NextResponse.json({
                    success: false,
                    error: 'Business application auction has expired'
                });
            }
            
            // Parse contact information from multiple sources
            let contactPerson = 'N/A';
            let contactPhone = 'N/A';
            
            // Priority 1: Application contact info (most recent)
            if (application.contact_person && application.contact_person.trim() !== '') {
                contactPerson = application.contact_person;
            } else if (businessUser.contact_person && businessUser.contact_person.trim() !== '') {
                contactPerson = businessUser.contact_person;
            }
            
            // Priority 1: Application phone (most recent)
            if (application.contact_person_number && application.contact_person_number.trim() !== '') {
                contactPhone = application.contact_person_number;
            } else if (businessUser.contact_person_number && businessUser.contact_person_number.trim() !== '') {
                contactPhone = businessUser.contact_person_number;
            }
            
            // Try to extract from contact_info JSONB if available and no contact found
            if ((contactPerson === 'N/A' || contactPhone === 'N/A') && businessUser.contact_info) {
                try {
                    const contactInfo = typeof businessUser.contact_info === 'string' 
                        ? JSON.parse(businessUser.contact_info) 
                        : businessUser.contact_info;
                    
                    if (contactInfo.contact_person && contactPerson === 'N/A') {
                        contactPerson = contactInfo.contact_person;
                    }
                    if (contactInfo.phone && contactPhone === 'N/A') {
                        contactPhone = contactInfo.phone;
                    }
                    if (contactInfo.contact_person_number && contactPhone === 'N/A') {
                        contactPhone = contactInfo.contact_person_number;
                    }
                } catch (e) {
                    console.log('⚠️ Could not parse contact_info JSON:', e.message);
                }
            }
            
            console.log(`📞 Contact Info: Person: ${contactPerson}, Phone: ${contactPhone}`);
            
            // Return business information
            return NextResponse.json({
                success: true,
                business_info: {
                    application_id: application.application_id,
                    trade_name: businessUser.trade_name,
                    cr_number: businessUser.cr_number,
                    cr_national_number: businessUser.cr_national_number,
                    city: application.application_city || businessUser.city,
                    cr_capital: application.application_cr_capital || businessUser.cr_capital,
                    cash_capital: businessUser.cash_capital,
                    preferred_repayment_period_months: application.preferred_repayment_period_months,
                    legal_form: application.application_legal_form || businessUser.legal_form,
                    registration_status: application.application_registration_status || businessUser.registration_status,
                    business_email: businessUser.business_email,
                    contact_person: contactPerson,
                    contact_phone: contactPhone,
                    requested_financing_amount: application.requested_financing_amount,
                    number_of_pos_devices: application.number_of_pos_devices,
                    pos_provider_name: application.pos_provider_name,
                    avg_monthly_pos_sales: application.avg_monthly_pos_sales,
                    activities: businessUser.activities,
                    has_ecommerce: businessUser.has_ecommerce,
                    store_url: businessUser.store_url,
                    management_structure: businessUser.management_structure,
                    notes: application.notes,
                    submitted_at: application.submitted_at,
                    issue_date_gregorian: businessUser.issue_date_gregorian,
                    confirmation_date_gregorian: businessUser.confirmation_date_gregorian,
                    address: businessUser.address,
                    sector: businessUser.sector,
                    in_kind_capital: businessUser.in_kind_capital,
                    avg_capital: businessUser.avg_capital,
                    headquarter_district_name: businessUser.headquarter_district_name,
                    headquarter_street_name: businessUser.headquarter_street_name,
                    headquarter_building_number: businessUser.headquarter_building_number,
                    is_verified: businessUser.is_verified,
                    verification_date: businessUser.verification_date,
                    status: actualStatus,
                    auction_end_time: application.auction_end_time,
                    offers_count: application.offers_count
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error validating CR number:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error: ' + error.message },
            { status: 500 }
        );
    }
}
