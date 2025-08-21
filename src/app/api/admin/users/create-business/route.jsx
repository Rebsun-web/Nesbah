import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req) {
    try {
        const body = await req.json();
        const { 
            cr_national_number, 
            trade_name, 
            // Optional fields that can be provided manually or fetched from Wathiq
            cr_number,
            address,
            sector,
            registration_status,
            cash_capital,
            in_kind_capital,
            contact_info,
            store_url,
            form_name,
            issue_date_gregorian,
            confirmation_date_gregorian,
            has_ecommerce,
            management_structure,
            management_managers,
            cr_capital,
            city,
            contact_person,
            contact_person_number,
            // Flag to determine if we should fetch from Wathiq API
            fetch_from_wathiq = true
        } = body;

        // If fetch_from_wathiq is true, we need cr_national_number
        if (fetch_from_wathiq && !cr_national_number) {
            return NextResponse.json(
                { success: false, error: 'cr_national_number is required when fetching from Wathiq API' },
                { status: 400 }
            );
        }

        // If not fetching from Wathiq, we need at least trade_name
        if (!fetch_from_wathiq && !trade_name) {
            return NextResponse.json(
                { success: false, error: 'trade_name is required when not fetching from Wathiq API' },
                { status: 400 }
            );
        }

        let wathiqData = null;

        // Fetch data from Wathiq API if requested
        if (fetch_from_wathiq && cr_national_number) {
            try {
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
                    return NextResponse.json(
                        { success: false, error: 'Failed to fetch data from Wathiq API' },
                        { status: 502 }
                    );
                }

                wathiqData = await response.json();
            } catch (error) {
                console.error('Wathiq API request failed:', error);
                return NextResponse.json(
                    { success: false, error: 'Failed to connect to Wathiq API' },
                    { status: 502 }
                );
            }
        }

        // Extract data from Wathiq API or use provided values
        const extractedData = wathiqData ? {
            crNationalNumber: wathiqData.crNationalNumber,
            crNumber: wathiqData.crNumber,
            crCapital: wathiqData.crCapital,
            trade_name: wathiqData.name,
            registration_status: wathiqData.status?.name?.toLowerCase(),
            address: wathiqData.headquarterCityName || null,
            sector: wathiqData.activities?.map((a) => a.name).join(', ') || null,
            storeUrl: wathiqData?.eCommerce?.eStore?.[0]?.storeUrl || null,
            cashCapital: wathiqData?.capital?.stockCapital?.cashCapital ?? null,
            inKindCapital: wathiqData?.capital?.stockCapital?.inKindCapital ?? null,
            contactInfo: wathiqData?.contactInfo || null,
            formName: wathiqData?.entityType?.formName || null,
            issueDateGregorian: wathiqData?.issueDateGregorian || null,
            confirmationDateGregorian: wathiqData?.status?.confirmationDate?.gregorian || null,
            hasEcommerce: wathiqData?.hasEcommerce || false,
            managementStructure: wathiqData?.management?.structureName || null,
            managementManagers: wathiqData?.management?.managers?.map(manager => manager.name) || [],
        } : {};

        // Use provided values as fallbacks or overrides
        const finalData = {
            cr_national_number: cr_national_number || extractedData.crNationalNumber,
            cr_number: cr_number || extractedData.crNumber,
            trade_name: trade_name || extractedData.trade_name,
            registration_status: registration_status || extractedData.registration_status || 'active',
            address: address || extractedData.address,
            sector: sector || extractedData.sector,
            store_url: store_url || extractedData.storeUrl,
            cash_capital: cash_capital || extractedData.cashCapital,
            in_kind_capital: in_kind_capital || extractedData.inKindCapital,
            contact_info: contact_info || extractedData.contactInfo,
            form_name: form_name || extractedData.formName,
            issue_date_gregorian: issue_date_gregorian || extractedData.issueDateGregorian,
            confirmation_date_gregorian: confirmation_date_gregorian || extractedData.confirmationDateGregorian,
            has_ecommerce: has_ecommerce !== undefined ? has_ecommerce : extractedData.hasEcommerce,
            management_structure: management_structure || extractedData.managementStructure,
            management_managers: management_managers || extractedData.managementManagers,
            cr_capital: cr_capital || extractedData.crCapital,
            city: city || null,
            contact_person: contact_person || null,
            contact_person_number: contact_person_number || null,
        };

        // Validate registration status if it came from Wathiq
        if (wathiqData && finalData.registration_status !== 'active') {
            return NextResponse.json(
                { success: false, error: 'Registration status is not active. Cannot proceed.' },
                { status: 403 }
            );
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Create business user record directly (no user record needed)
            const businessUserResult = await client.query(
                `INSERT INTO business_users (
                    cr_national_number, cr_number, trade_name, address, sector, 
                    registration_status, cash_capital, in_kind_capital, contact_info, 
                    store_url, form_name, issue_date_gregorian, confirmation_date_gregorian, 
                    has_ecommerce, management_structure, management_managers, cr_capital,
                    city, contact_person, contact_person_number
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                RETURNING user_id`,
                [
                    finalData.cr_national_number,
                    finalData.cr_number,
                    finalData.trade_name,
                    finalData.address,
                    finalData.sector,
                    finalData.registration_status,
                    finalData.cash_capital,
                    finalData.in_kind_capital,
                    finalData.contact_info ? JSON.stringify(finalData.contact_info) : null,
                    finalData.store_url,
                    finalData.form_name,
                    finalData.issue_date_gregorian,
                    finalData.confirmation_date_gregorian,
                    finalData.has_ecommerce,
                    finalData.management_structure,
                    finalData.management_managers ? JSON.stringify(finalData.management_managers) : null,
                    finalData.cr_capital,
                    finalData.city,
                    finalData.contact_person,
                    finalData.contact_person_number
                ]
            );
            
            const user_id = businessUserResult.rows[0].user_id;

            // Log the admin action
            await client.query(
                `INSERT INTO admin_audit_log 
                    (action, table_name, record_id, admin_user_id, details, timestamp)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                ['CREATE', 'business_users', user_id, 1, JSON.stringify({
                    cr_national_number: finalData.cr_national_number,
                    trade_name: finalData.trade_name,
                    fetch_from_wathiq,
                    wathiq_data_received: !!wathiqData
                })]
            );

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Business user created successfully',
                data: {
                    user_id,
                    trade_name: finalData.trade_name,
                    cr_national_number: finalData.cr_national_number,
                    registration_status: finalData.registration_status,
                    wathiq_data_used: !!wathiqData,
                    created_at: new Date().toISOString()
                }
            });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Database transaction failed:', err);
            return NextResponse.json(
                { success: false, error: 'Failed to create business user' },
                { status: 500 }
            );
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Unexpected error:', err);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
