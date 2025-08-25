import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Mock SAMA bank registry data (in real implementation, this would be an API call)
const MOCK_SAMA_BANKS = {
    '1000': {
        entity_name: 'Saudi National Bank',
        sama_license_number: '1000',
        bank_type: 'Commercial Bank',
        license_status: 'Active',
        establishment_date: '1953-06-26',
        authorized_capital: 50000000000,
        head_office_address: 'King Fahd Road, Riyadh',
        sama_compliance_status: 'Compliant',
        number_of_branches: 400,
        contact_info: {
            phone: '+966114040000',
            email: 'info@snb.com.sa',
            website: 'www.snb.com.sa'
        }
    },
    '1001': {
        entity_name: 'Riyad Bank',
        sama_license_number: '1001',
        bank_type: 'Commercial Bank',
        license_status: 'Active',
        establishment_date: '1957-04-23',
        authorized_capital: 30000000000,
        head_office_address: 'King Fahd Road, Riyadh',
        sama_compliance_status: 'Compliant',
        number_of_branches: 350,
        contact_info: {
            phone: '+966114010000',
            email: 'info@riyadbank.com.sa',
            website: 'www.riyadbank.com.sa'
        }
    },
    '1002': {
        entity_name: 'Arab National Bank',
        sama_license_number: '1002',
        bank_type: 'Commercial Bank',
        license_status: 'Active',
        establishment_date: '1979-12-21',
        authorized_capital: 15000000000,
        head_office_address: 'King Fahd Road, Riyadh',
        sama_compliance_status: 'Compliant',
        number_of_branches: 200,
        contact_info: {
            phone: '+966114020000',
            email: 'info@anb.com.sa',
            website: 'www.anb.com.sa'
        }
    },
    '1003': {
        entity_name: 'Bank AlJazira',
        sama_license_number: '1003',
        bank_type: 'Commercial Bank',
        license_status: 'Active',
        establishment_date: '1975-04-30',
        authorized_capital: 8000000000,
        head_office_address: 'King Fahd Road, Jeddah',
        sama_compliance_status: 'Compliant',
        number_of_branches: 120,
        contact_info: {
            phone: '+966126500000',
            email: 'info@bankaljazira.com',
            website: 'www.bankaljazira.com'
        }
    },
    '1004': {
        entity_name: 'Al Rajhi Bank',
        sama_license_number: '1004',
        bank_type: 'Islamic Bank',
        license_status: 'Active',
        establishment_date: '1957-04-23',
        authorized_capital: 25000000000,
        head_office_address: 'King Fahd Road, Riyadh',
        sama_compliance_status: 'Compliant',
        number_of_branches: 500,
        contact_info: {
            phone: '+966114030000',
            email: 'info@alrajhibank.com.sa',
            website: 'www.alrajhibank.com.sa'
        }
    },
    '1005': {
        entity_name: 'Samba Financial Group',
        sama_license_number: '1005',
        bank_type: 'Commercial Bank',
        license_status: 'Active',
        establishment_date: '1980-02-12',
        authorized_capital: 20000000000,
        head_office_address: 'King Fahd Road, Riyadh',
        sama_compliance_status: 'Compliant',
        number_of_branches: 180,
        contact_info: {
            phone: '+966114050000',
            email: 'info@samba.com.sa',
            website: 'www.samba.com.sa'
        }
    },
    '1006': {
        entity_name: 'Saudi Investment Bank',
        sama_license_number: '1006',
        bank_type: 'Commercial Bank',
        license_status: 'Active',
        establishment_date: '1976-06-23',
        authorized_capital: 10000000000,
        head_office_address: 'King Fahd Road, Riyadh',
        sama_compliance_status: 'Compliant',
        number_of_branches: 80,
        contact_info: {
            phone: '+966114060000',
            email: 'info@saib.com.sa',
            website: 'www.saib.com.sa'
        }
    },
    '1007': {
        entity_name: 'Saudi Hollandi Bank',
        sama_license_number: '1007',
        bank_type: 'Commercial Bank',
        license_status: 'Active',
        establishment_date: '1977-03-15',
        authorized_capital: 12000000000,
        head_office_address: 'King Fahd Road, Riyadh',
        sama_compliance_status: 'Compliant',
        number_of_branches: 90,
        contact_info: {
            phone: '+966114070000',
            email: 'info@shb.com.sa',
            website: 'www.shb.com.sa'
        }
    }
};

export async function POST(req) {
    try {
        const body = await req.json();
        const { sama_license_number, email } = body;

        // Validate required fields
        if (!sama_license_number || !email) {
            return NextResponse.json(
                { success: false, error: 'SAMA License Number and email are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await pool.query(
            `SELECT user_id FROM users WHERE email = $1 OR user_id IN (
                SELECT user_id FROM bank_users WHERE sama_license_number = $2
            )`,
            [email, sama_license_number]
        );

        if (existingUser.rowCount > 0) {
            return NextResponse.json(
                { success: false, error: 'User with this email or SAMA license number already exists' },
                { status: 409 }
            );
        }

        // Simulate SAMA API call (in real implementation, this would be an actual API call)
        const bankData = MOCK_SAMA_BANKS[sama_license_number];

        if (!bankData) {
            return NextResponse.json(
                { success: false, error: 'SAMA License Number not found' },
                { status: 404 }
            );
        }

        // Check if bank license is active
        if (bankData.license_status !== 'Active') {
            return NextResponse.json(
                { success: false, error: 'Bank license is currently suspended' },
                { status: 403 }
            );
        }

        // Check SAMA compliance status
        if (bankData.sama_compliance_status !== 'Compliant') {
            return NextResponse.json(
                { success: false, error: 'Bank is not compliant with SAMA regulations' },
                { status: 403 }
            );
        }

        // Return verified bank data
        const verifiedData = {
            sama_license_number: bankData.sama_license_number,
            entity_name: bankData.entity_name,
            bank_type: bankData.bank_type,
            license_status: bankData.license_status,
            establishment_date: bankData.establishment_date,
            authorized_capital: bankData.authorized_capital,
            head_office_address: bankData.head_office_address,
            sama_compliance_status: bankData.sama_compliance_status,
            number_of_branches: bankData.number_of_branches,
            contact_info: bankData.contact_info
        };

        return NextResponse.json({
            success: true,
            message: 'Bank verification successful',
            data: verifiedData
        });

    } catch (err) {
        console.error('Bank verification error:', err);
        return NextResponse.json(
            { success: false, error: 'Banking verification temporarily unavailable' },
            { status: 500 }
        );
    }
}
