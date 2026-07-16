import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { 
    sendApplicationSubmissionEmail, 
    sendNewApplicationNotificationToBanks 
} from '@/lib/email/emailNotifications';
import { auctionConfig } from '@/lib/config/auction-config';

export async function POST(req) {
    try {
        const body = await req.json();
        console.log('📥 POS Application API: Received body:', {
            ...body,
            uploaded_document: body.uploaded_document ? `[base64 data: ${body.uploaded_document.substring(0, 50)}...]` : null
        });
        
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
            approximate_financing_amount,
            preferred_repayment_period_months
        } = body;

        const submitted_at = new Date(); // capture submit time
        const auction_end_time = new Date(submitted_at.getTime() + auctionConfig.durationMilliseconds); // Configured duration from submission time

        const client = await pool.connectWithRetry(2, 1000, 'app_api_posApplication_route.jsx_route');
        
        try {
            await client.query('BEGIN');

            // Single query to get business info + wathiq_data_id (added in migration 005)
            const businessResult = await client.query(
                `SELECT
                    wd.trade_name, wd.cr_number, bu.cr_national_number, wd.legal_form,
                    wd.registration_status, wd.issue_date_gregorian, wd.city,
                    wd.has_ecommerce, wd.store_url, wd.cr_capital,
                    wd.cash_capital, wd.management_structure, bu.wathiq_data_id,
                    u.email
                 FROM business_users bu
                 JOIN users u ON bu.user_id = u.user_id
                 LEFT JOIN wathiq_data wd ON bu.wathiq_data_id = wd.id
                 WHERE bu.user_id = $1`,
                [user_id]
            );

            if (businessResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ success: false, error: 'Business info not found' }, { status: 404 });
            }

            const business = businessResult.rows[0];

            // CRITICAL: Check if this business user already has a submitted application
            const existingApplicationQuery = `
                SELECT application_id, status, submitted_at
                FROM pos_application 
                WHERE user_id = $1 
                AND status IN ('live_auction', 'completed', 'ignored')
                ORDER BY submitted_at DESC
                LIMIT 1
            `;
            
            const existingApplicationResult = await client.query(existingApplicationQuery, [user_id]);
            const hasExistingApplication = existingApplicationResult.rows.length > 0;

            if (hasExistingApplication) {
                await client.query('ROLLBACK');
                const existingApp = existingApplicationResult.rows[0];
                return NextResponse.json({ 
                    success: false, 
                    error: 'You already have a submitted application. Only one application per business is allowed.',
                    details: {
                        existing_application_id: existingApp.application_id,
                        status: existingApp.status,
                        submitted_at: existingApp.submitted_at
                    }
                }, { status: 400 });
            }

            // Note: Removed problematic JSON fields (activities, contact_info, management_managers) 
            // to avoid JSON parsing errors. These fields are not essential for POS application submission.

            const posAppResult = await client.query(
                `INSERT INTO pos_application
                    (user_id, status, submitted_at, notes, uploaded_document, own_pos_system,
                     uploaded_filename, uploaded_mimetype,
                     wathiq_data_id, cr_national_number,
                     contact_person, contact_person_number, number_of_pos_devices,
                     city_of_operation, auction_end_time, opened_by, purchased_by,
                     pos_provider_name, pos_age_duration_months, avg_monthly_pos_sales,
                     approximate_financing_amount, preferred_repayment_period_months)
                VALUES
                    ($1, 'live_auction', $2, $3, $4, $5, $6, $7,
                     $8, $9,
                     $10, $11, $12,
                     $13, $14, '{}', '{}',
                     $15, $16, $17, $18, $19)
                RETURNING application_id`,
                [
                    user_id,                                          // $1
                    submitted_at,                                     // $2
                    notes || null,                                    // $3
                    uploaded_document ? Buffer.from(uploaded_document, 'base64') : null, // $4
                    own_pos_system ?? null,                           // $5
                    uploaded_filename || null,                        // $6
                    uploaded_mimetype || null,                        // $7
                    business.wathiq_data_id || null,                  // $8  ← FK to wathiq_data
                    business.cr_national_number,                      // $9  ← natural JOIN key
                    contact_person || null,                           // $10
                    contact_person_number || null,                    // $11
                    number_of_pos_devices || null,                    // $12
                    city_of_operation || null,                        // $13
                    auction_end_time,                                 // $14
                    pos_provider_name || null,                        // $15
                    pos_age_duration_months || null,                  // $16
                    avg_monthly_pos_sales || null,                    // $17
                    approximate_financing_amount || null,             // $18
                    preferred_repayment_period_months || null,        // $19
                ]
            );

            const application_id = posAppResult.rows[0].application_id;

            // Get bank users for email notification
            // Notify login-capable bank employees (entity banks have no email) plus any
            // legacy bank_user rows that still carry an email.
            const bankUsersResult = await client.query(
                `SELECT email FROM users
                 WHERE account_status = 'active'
                   AND email IS NOT NULL
                   AND user_type IN ('bank_user', 'bank_employee')`
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
                approximate_financing_amount,
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
            console.error('❌ Database transaction failed:', err);
            console.error('❌ Error details:', {
                message: err.message,
                code: err.code,
                detail: err.detail,
                hint: err.hint,
                position: err.position,
                stack: err.stack
            });
            return NextResponse.json({ 
                success: false, 
                error: 'Submission failed', 
                details: process.env.NODE_ENV === 'development' ? err.message : undefined 
            }, { status: 500 });
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err);
        console.error('❌ Error details:', {
            message: err.message,
            stack: err.stack
        });
        return NextResponse.json({ 
            success: false, 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined  
        }, { status: 500 });
    }
}
