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

        // Return comprehensive verified data with all required Wathiq API fields
        const verifiedData = {
            // 1.1 Required Data Fields from Wathiq API
            cr_national_number: wathiqData.cr_national_number,
            cr_number: wathiqData.cr_number,
            trade_name: wathiqData.trade_name,
            legal_form: wathiqData.legal_form,
            registration_status: wathiqData.registration_status,
            headquarter_city_name: wathiqData.headquarter_city_name,
            issue_date_gregorian: wathiqData.issue_date_gregorian,
            confirmation_date_gregorian: wathiqData.confirmation_date_gregorian,
            contact_info: wathiqData.contact_info,
            activities: wathiqData.activities,
            has_ecommerce: wathiqData.has_ecommerce,
            store_url: wathiqData.store_url,
            cr_capital: wathiqData.cr_capital,
            cash_capital: wathiqData.cash_capital,
            management_structure: wathiqData.management_structure,
            management_managers: wathiqData.management_managers,
            
            // Additional fields for completeness
            address: wathiqData.address,
            sector: wathiqData.sector,
            in_kind_capital: wathiqData.in_kind_capital,
            avg_capital: wathiqData.avg_capital,
            headquarter_district_name: wathiqData.headquarter_district_name,
            headquarter_street_name: wathiqData.headquarter_street_name,
            headquarter_building_number: wathiqData.headquarter_building_number,
            city: wathiqData.city,
            
            // Verification information
            is_verified: wathiqData.is_verified,
            verification_date: wathiqData.verification_date,
            admin_notes: wathiqData.admin_notes,
            
            // Raw data for debugging
            raw_wathiq_data: wathiqData.raw_wathiq_data
        };

        console.log('✅ Returning verified data with all required Wathiq API fields:', {
            cr_national_number: verifiedData.cr_national_number,
            trade_name: verifiedData.trade_name,
            legal_form: verifiedData.legal_form,
            registration_status: verifiedData.registration_status,
            activities_count: verifiedData.activities?.length || 0,
            has_ecommerce: verifiedData.has_ecommerce,
            cr_capital: verifiedData.cr_capital,
            management_managers_count: verifiedData.management_managers?.length || 0
        });

        return NextResponse.json({
            success: true,
            message: 'Business verification successful with comprehensive Wathiq API data',
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
