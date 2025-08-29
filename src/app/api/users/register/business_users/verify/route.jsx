import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import WathiqAPIService from '@/lib/wathiq-api-service';

export async function POST(req) {
    try {
        const body = await req.json();
        const { cr_national_number } = body;

        // Validate required fields
        if (!cr_national_number) {
            return NextResponse.json(
                { success: false, error: 'CR National Number is required' },
                { status: 400 }
            );
        }

        // Check if business user already exists
        const existingBusiness = await pool.query(
            `SELECT bu.user_id, u.email, u.user_type 
             FROM business_users bu 
             JOIN users u ON bu.user_id = u.user_id 
             WHERE bu.cr_national_number = $1`,
            [cr_national_number]
        );

        if (existingBusiness.rowCount > 0) {
            const existing = existingBusiness.rows[0];
            return NextResponse.json(
                { 
                    success: false, 
                    error: `Business with CR number ${cr_national_number} is already registered. If this is your business, please log in with the associated email account.`,
                    existingEmail: existing.email,
                    userType: existing.user_type
                },
                { status: 409 }
            );
        }

        // Call Wathiq API for verification using the comprehensive service
        let wathiqData;
        try {
            console.log(`🔍 Verifying business with CR: ${cr_national_number}`);
            wathiqData = await WathiqAPIService.fetchBusinessData(cr_national_number, 'en');
            console.log('✅ Wathiq verification successful');
        } catch (error) {
            console.error('❌ Wathiq API verification failed:', error);
            
            if (error.message.includes('404')) {
                return NextResponse.json(
                    { success: false, error: 'Please check your CR Number format' },
                    { status: 400 }
                );
            }
            
            return NextResponse.json(
                { success: false, error: 'Verification temporarily unavailable' },
                { status: 502 }
            );
        }

        // Check if company status is active
        if (wathiqData.registration_status !== 'active') {
            return NextResponse.json(
                { success: false, error: 'Company status is inactive in Wathiq' },
                { status: 403 }
            );
        }

        // Return comprehensive verified data
        const verifiedData = {
            cr_national_number: wathiqData.cr_national_number,
            cr_number: wathiqData.cr_number,
            trade_name: wathiqData.trade_name,
            registration_status: wathiqData.registration_status,
            address: wathiqData.address,
            city: wathiqData.city,
            sector: wathiqData.sector,
            activities: wathiqData.activities,
            cr_capital: wathiqData.cr_capital,
            cash_capital: wathiqData.cash_capital,
            in_kind_capital: wathiqData.in_kind_capital,
            avg_capital: wathiqData.avg_capital,
            legal_form: wathiqData.legal_form,
            issue_date_gregorian: wathiqData.issue_date_gregorian,
            confirmation_date_gregorian: wathiqData.confirmation_date_gregorian,
            has_ecommerce: wathiqData.has_ecommerce,
            management_structure: wathiqData.management_structure,
            management_managers: wathiqData.management_managers,
            contact_info: wathiqData.contact_info,
            store_url: wathiqData.store_url,
            is_verified: wathiqData.is_verified,
            verification_date: wathiqData.verification_date,
            admin_notes: wathiqData.admin_notes,
        };

        return NextResponse.json({
            success: true,
            message: 'Business verification successful',
            data: verifiedData
        });

    } catch (err) {
        console.error('Business verification error:', err);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
