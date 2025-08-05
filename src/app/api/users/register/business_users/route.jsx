import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req) {
    try {
        const body = await req.json();
        const { cr_national_number, password, email } = body;

        const response = await fetch(`https://api.wathq.sa/commercial-registration/fullinfo/${cr_national_number}?language=en`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apiKey': 'vFRBMGAv78vRdCAnbXhVJMcN6AaxLn34', // Don't hardcode the key, use env
            },
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Wathq API error:', errText);
            return NextResponse.json({ success: false, error: 'Failed to fetch data from Wathq API' }, { status: 502 });
        }

        const data = await response.json();

        // Extracted info from wathiq
        const crNationalNumber = data.crNationalNumber;
        const crNumber = data.crNumber;
        const crCapital = data.crCapital;
        const trade_name = data.name;
        const registration_status = data.status?.name?.toLowerCase();
        const address = data.headquarterCityName || null;
        const sector = data.activities?.map((a) => a.name).join(', ') || null;
        const storeUrl = data?.eCommerce?.eStore?.[0]?.storeUrl || null;
        const cashCapital = data?.capital?.stockCapital?.cashCapital ?? null;
        const inKindCapital = data?.capital?.stockCapital?.inKindCapital ?? null;
        const contactInfo = data?.contactInfo || null;

        const formName = data?.entityType?.formName || null;
        const issueDateGregorian = data?.issueDateGregorian || null;
        const confirmationDateGregorian = data?.status?.confirmationDate?.gregorian || null;
        const hasEcommerce = data?.hasEcommerce || false;
        const managementStructure = data?.management?.structureName || null;
        const managementManagers = data?.management?.managers?.map(manager => manager.name) || [];

        if (registration_status !== 'active') {
            return NextResponse.json({ success: false, error: 'Registration status is not active. Cannot proceed.' }, { status: 403 });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const userRes = await client.query(
                `INSERT INTO users (email, password, user_type) VALUES ($1, $2, $3) RETURNING user_id`,
                [email, password, 'business_user']
            );
            const user_id = userRes.rows[0].user_id;

            await client.query(
                `INSERT INTO business_users
                 (user_id, cr_number, cr_national_number, trade_name, address, sector, registration_status,
                  cash_capital, in_kind_capital, contact_info, store_url, form_name, issue_date_gregorian,
                  confirmation_date_gregorian, has_ecommerce, management_structure, management_managers,cr_capital)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
                [
                    user_id,
                    crNumber,
                    crNationalNumber,
                    trade_name,
                    address,
                    sector,
                    registration_status,
                    cashCapital,
                    inKindCapital,
                    contactInfo ? JSON.stringify(contactInfo) : null,
                    storeUrl,
                    formName,
                    issueDateGregorian,
                    confirmationDateGregorian,
                    hasEcommerce,
                    managementStructure,
                    managementManagers ? JSON.stringify(managementManagers) : null,
                    crCapital,
                ]
            );



            await client.query('COMMIT');
            return NextResponse.json({ success: true, message: 'Business registered successfully' });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Database transaction failed:', err);
            return NextResponse.json({ success: false, error: 'Registration failed' }, { status: 500 });
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Unexpected error:', err);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
