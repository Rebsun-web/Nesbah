import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req) {
    try {
        const body = await req.json();
        const { cr_national_number, email } = body;

        // Validate required fields
        if (!cr_national_number || !email) {
            return NextResponse.json(
                { success: false, error: 'CR National Number and email are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await pool.query(
            `SELECT user_id FROM users WHERE email = $1 OR user_id IN (
                SELECT user_id FROM business_users WHERE cr_national_number = $2
            )`,
            [email, cr_national_number]
        );

        if (existingUser.rowCount > 0) {
            return NextResponse.json(
                { success: false, error: 'User with this email or CR number already exists' },
                { status: 409 }
            );
        }

        // Call Wathiq API for verification
        const response = await fetch(`https://api.wathq.sa/commercial-registration/fullinfo/${cr_national_number}?language=en`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apiKey': 'vFRBMGAv78vRdCAnbXhVJMcN6AaxLn34', // Should use env variable
            },
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Wathiq API error:', errText);
            
            if (response.status === 404) {
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

        const data = await response.json();

        // Check if company status is active
        const registration_status = data.status?.name?.toLowerCase();
        if (registration_status !== 'active') {
            return NextResponse.json(
                { success: false, error: 'Company status is inactive in Wathiq' },
                { status: 403 }
            );
        }

        // Extract and return verified data
        const verifiedData = {
            cr_national_number: data.crNationalNumber,
            cr_number: data.crNumber,
            trade_name: data.name,
            registration_status: registration_status,
            address: data.headquarterCityName || null,
            sector: data.activities?.map((a) => a.name).join(', ') || null,
            cr_capital: data.crCapital,
            cash_capital: data?.capital?.stockCapital?.cashCapital ?? null,
            in_kind_capital: data?.capital?.stockCapital?.inKindCapital ?? null,
            legal_form: data?.entityType?.formName || null,
            issue_date_gregorian: data?.issueDateGregorian || null,
            confirmation_date_gregorian: data?.status?.confirmationDate?.gregorian || null,
            has_ecommerce: data?.hasEcommerce || false,
            management_structure: data?.management?.structureName || null,
            management_managers: data?.management?.managers?.map(manager => manager.name) || [],
            contact_info: data?.contactInfo || null,
            store_url: data?.eCommerce?.eStore?.[0]?.storeUrl || null
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
