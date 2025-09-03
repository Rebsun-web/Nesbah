import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { 
    sendApplicationSubmissionEmail, 
    sendNewApplicationNotificationToBanks 
} from '@/lib/email/emailNotifications';

export async function POST(req) {
    try {
        const body = await req.json();
        const {
            user_id,
            notes,
            uploaded_document,
            uploaded_filename,
            uploaded_mimetype,
            own_pos_system,
            contact_person,
            contact_person_number,
            number_of_pos_devices,
            city_of_operation,
            pos_provider_name,
            pos_age_duration_months,
            avg_monthly_pos_sales,
            requested_financing_amount,
            preferred_repayment_period_months
        } = body;

        const submitted_at = new Date(); // capture submit time
        const auction_end_time = new Date(submitted_at.getTime() + 48 * 60 * 60 * 1000); // 48 hours from submission time

        const client = await pool.connectWithRetry(2, 1000, 'app_api_posApplication_route.jsx_route');
        
        try {
            await client.query('BEGIN');

            // OPTIMIZED: Single query to get business info and validate user exists
            const businessResult = await client.query(
                `SELECT 
                    bu.trade_name, bu.cr_number, bu.cr_national_number, bu.legal_form, 
                    bu.registration_status, bu.issue_date_gregorian, bu.city, 
                    bu.has_ecommerce, bu.store_url, bu.cr_capital, 
                    bu.cash_capital, bu.management_structure, u.email
                 FROM business_users bu
                 JOIN users u ON bu.user_id = u.user_id
                 WHERE bu.user_id = $1`,
                [user_id]
            );

            if (businessResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ success: false, error: 'Business info not found' }, { status: 404 });
            }

            const business = businessResult.rows[0];

            // Note: Removed problematic JSON fields (activities, contact_info, management_managers) 
            // to avoid JSON parsing errors. These fields are not essential for POS application submission.

            // UPDATED: Insert into pos_application with all data in one query (no ignored_by needed)
            const posAppResult = await client.query(
                `
                INSERT INTO pos_application 
                    (user_id, status, submitted_at, notes, uploaded_document, own_pos_system, 
                     uploaded_filename, uploaded_mimetype, trade_name, cr_number, cr_national_number, 
                     legal_form, registration_status, issue_date_gregorian, city, 
                     has_ecommerce, store_url, cr_capital, cash_capital, management_structure, 
                     contact_person, contact_person_number, number_of_pos_devices, 
                     city_of_operation, auction_end_time, opened_by, purchased_by,
                     pos_provider_name, pos_age_duration_months, avg_monthly_pos_sales,
                     requested_financing_amount, preferred_repayment_period_months)
                VALUES 
                    ($1, 'live_auction', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
                     $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
                RETURNING application_id
                `,
                [
                    user_id, submitted_at, notes || null,
                    uploaded_document ? Buffer.from(uploaded_document, 'base64') : null,
                    own_pos_system ?? null, uploaded_filename || null, uploaded_mimetype || null,
                    business.trade_name, business.cr_number, business.cr_national_number,
                    business.legal_form, business.registration_status, business.issue_date_gregorian,
                    business.city, business.has_ecommerce,
                    business.store_url, business.cr_capital, business.cash_capital,
                    business.management_structure,
                    contact_person || null, contact_person_number || null,
                    number_of_pos_devices || null, city_of_operation || null, auction_end_time,
                    [], [], // Initialize empty arrays for tracking (no ignored_by needed)
                    pos_provider_name || null, pos_age_duration_months || null, avg_monthly_pos_sales || null,
                    requested_financing_amount || null, preferred_repayment_period_months || null
                ]
            );

            const application_id = posAppResult.rows[0].application_id;

            // Get bank users for email notification
            const bankUsersResult = await client.query(
                'SELECT email FROM users WHERE user_type = $1 AND account_status = $2',
                ['bank_user', 'active']
            );

            await client.query('COMMIT');

            // Prepare application data for emails
            const applicationData = {
                application_id,
                trade_name: business.trade_name,
                cr_number: business.cr_number,
                city: business.city,
                legal_form: business.legal_form,
                submitted_at,
                auction_end_time,
                city_of_operation,
                number_of_pos_devices,
                requested_financing_amount,
                preferred_repayment_period_months
            };

            // Send confirmation email to business user
            if (business.email) {
                try {
                    await sendApplicationSubmissionEmail(business.email, applicationData);
                    console.log(`✅ Application submission confirmation sent to business: ${business.email}`);
                } catch (emailError) {
                    console.error(`❌ Failed to send business confirmation email:`, emailError);
                    // Don't fail the application submission if email fails
                }
            }

            // Send notifications to banks about new application
            const bankEmails = bankUsersResult.rows.map(row => row.email).filter(Boolean);
            if (bankEmails.length > 0) {
                try {
                    await sendNewApplicationNotificationToBanks(bankEmails, applicationData);
                    console.log(`✅ New application notifications sent to ${bankEmails.length} banks`);
                } catch (emailError) {
                    console.error(`❌ Failed to send bank notifications:`, emailError);
                    // Don't fail the application submission if email fails
                }
            }

            return NextResponse.json({
                success: true,
                application_id: application_id,
            });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Database transaction failed:', err);
            return NextResponse.json({ success: false, error: 'Submission failed' }, { status: 500 });
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Unexpected error:', err);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
