import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req) {
    try {
        console.log('🧪 Creating fresh 5-minute test application...');
        
        const client = await pool.connectWithRetry(2, 1000, 'create-fresh-5min-test');
        
        try {
            await client.query('BEGIN');
            
            // Delete the old test application first
            await client.query(`DELETE FROM pos_application WHERE application_id = 2`);
            
            // Create a completely new application with fresh timestamps
            const now = new Date();
            const auction_end_time = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
            
            const posAppResult = await client.query(
                `INSERT INTO pos_application (
                    user_id, status, submitted_at, notes, uploaded_document, own_pos_system, 
                    uploaded_filename, uploaded_mimetype, trade_name, cr_number, cr_national_number, 
                    legal_form, registration_status, issue_date_gregorian, city, 
                    has_ecommerce, store_url, cr_capital, cash_capital, management_structure, 
                    contact_person, contact_person_number, number_of_pos_devices, 
                    city_of_operation, auction_end_time, opened_by, purchased_by,
                    pos_provider_name, pos_age_duration_months, avg_monthly_pos_sales,
                    requested_financing_amount, preferred_repayment_period_months,
                    offers_count, revenue_collected, created_at, updated_at
                ) VALUES (
                    $1, 'live_auction', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
                    $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
                ) RETURNING application_id
                `,
                [
                    736, // Tech Solutions Arabia user_id
                    now, // submitted_at (fresh timestamp)
                    'Fresh 5-minute test application for background task testing',
                    null, // uploaded_document
                    false, // own_pos_system
                    null, // uploaded_filename
                    null, // uploaded_mimetype
                    'Tech Solutions Arabia', 
                    'TEST-736', 
                    'TEST-CR-736',
                    'LLC', 
                    'active', 
                    new Date().toISOString().split('T')[0],
                    'Riyadh', 
                    false, // has_ecommerce
                    null, // store_url
                    100000, // cr_capital
                    50000, // cash_capital
                    'Standard', // management_structure
                    'Test Contact', // contact_person
                    '0500000000', // contact_person_number
                    2, // number_of_pos_devices
                    'Riyadh', // city_of_operation
                    auction_end_time, // auction_end_time (5 minutes from now)
                    [], // opened_by
                    [], // purchased_by
                    'Test POS Provider', // pos_provider_name
                    12, // pos_age_duration_months
                    50000, // avg_monthly_pos_sales
                    100000, // requested_financing_amount
                    24, // preferred_repayment_period_months
                    0, // offers_count
                    0, // revenue_collected
                    now, // created_at
                    now  // updated_at
                ]
            );
            
            const application_id = posAppResult.rows[0].application_id;
            
            await client.query('COMMIT');
            
            const timeUntilExpiry = Math.round((auction_end_time - now) / 1000 / 60);
            
            console.log('✅ Fresh 5-minute test application created successfully!');
            console.log(`   - Application ID: ${application_id}`);
            console.log(`   - Business: Tech Solutions Arabia`);
            console.log(`   - User ID: 736 (business@nesbah.com)`);
            console.log(`   - Submitted: ${now.toLocaleString()}`);
            console.log(`   - Expires: ${auction_end_time.toLocaleString()}`);
            console.log(`   - Time until expiry: ${timeUntilExpiry} minutes`);
            
            return NextResponse.json({
                success: true,
                message: 'Fresh 5-minute test application created successfully',
                data: {
                    application_id,
                    user_id: 736,
                    trade_name: 'Tech Solutions Arabia',
                    status: 'live_auction',
                    submitted_at: now.toISOString(),
                    auction_end_time: auction_end_time.toISOString(),
                    time_until_expiry_minutes: timeUntilExpiry,
                    submitted_at_formatted: now.toLocaleString(),
                    auction_end_time_formatted: auction_end_time.toLocaleString()
                }
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Error creating fresh 5-minute test application:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create fresh 5-minute test application' },
            { status: 500 }
        );
    }
}
