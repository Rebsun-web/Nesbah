// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN; // You'll need to set this

async function createBusinessUserWithWathiq(crNationalNumber) {
    try {
        console.log(`🔧 Creating business user with CR National Number: ${crNationalNumber}...\n`);
        
        const response = await fetch(`${API_BASE_URL}/api/admin/users/create-business`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `admin_token=${ADMIN_TOKEN}`
            },
            body: JSON.stringify({
                cr_national_number: crNationalNumber,
                fetch_from_wathiq: true
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Business user created successfully!');
            console.log('📊 Details:');
            console.log(`   User ID: ${result.data.user_id}`);
            console.log(`   Trade Name: ${result.data.trade_name}`);
            console.log(`   CR National Number: ${result.data.cr_national_number}`);
            console.log(`   Registration Status: ${result.data.registration_status}`);
            console.log(`   Wathiq Data Used: ${result.data.wathiq_data_used}`);
            console.log(`   Created At: ${result.data.created_at}`);
        } else {
            console.log('❌ Failed to create business user:');
            console.log(`   Error: ${result.error}`);
        }
        
        return result;
        
    } catch (error) {
        console.error('💥 Error creating business user:', error);
        throw error;
    }
}

async function createBusinessUserManually(businessData) {
    try {
        console.log(`🔧 Creating business user manually with trade name: ${businessData.trade_name}...\n`);
        
        const response = await fetch(`${API_BASE_URL}/api/admin/users/create-business`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `admin_token=${ADMIN_TOKEN}`
            },
            body: JSON.stringify({
                ...businessData,
                fetch_from_wathiq: false
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Business user created successfully!');
            console.log('📊 Details:');
            console.log(`   User ID: ${result.data.user_id}`);
            console.log(`   Trade Name: ${result.data.trade_name}`);
            console.log(`   CR National Number: ${result.data.cr_national_number}`);
            console.log(`   Registration Status: ${result.data.registration_status}`);
            console.log(`   Wathiq Data Used: ${result.data.wathiq_data_used}`);
            console.log(`   Created At: ${result.data.created_at}`);
        } else {
            console.log('❌ Failed to create business user:');
            console.log(`   Error: ${result.error}`);
        }
        
        return result;
        
    } catch (error) {
        console.error('💥 Error creating business user:', error);
        throw error;
    }
}

// Example usage functions
async function exampleWithWathiq() {
    // Example CR National Number (you'll need a real one)
    const crNationalNumber = '4030000001';
    await createBusinessUserWithWathiq(crNationalNumber);
}

async function exampleManual() {
    const businessData = {
        trade_name: 'Tech Solutions Ltd',
        cr_number: 'CR123456',
        cr_national_number: '4030000002',
        address: 'King Fahd Road, Riyadh',
        sector: 'Technology',
        registration_status: 'active',
        cash_capital: 100000,
        cr_capital: 150000,
        city: 'Riyadh',
        contact_person: 'Ahmed Al-Rashid',
        contact_person_number: '+966501234567',
        has_ecommerce: true,
        store_url: 'https://techsolutions.sa',
        legal_form: 'Limited Liability Company',
        management_structure: 'Board of Directors',
        contact_info: {
            phone: '+966501234567',
            email: 'info@techsolutions.sa',
            website: 'www.techsolutions.sa'
        }
    };
    
    await createBusinessUserManually(businessData);
}

// Main execution
async function main() {
    console.log('🚀 Business User Creation Script\n');
    
    if (!ADMIN_TOKEN) {
        console.log('❌ ADMIN_TOKEN environment variable is required');
        console.log('   Please set it to a valid admin session token');
        process.exit(1);
    }
    
    // Choose which example to run
    const args = process.argv.slice(2);
    const mode = args[0] || 'manual';
    
    try {
        if (mode === 'wathiq') {
            await exampleWithWathiq();
        } else if (mode === 'manual') {
            await exampleManual();
        } else {
            console.log('❌ Invalid mode. Use "wathiq" or "manual"');
            console.log('   Usage: node create-new-business-user.js [wathiq|manual]');
        }
    } catch (error) {
        console.error('💥 Script execution failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main()
        .then(() => {
            console.log('\n✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Script failed:', error);
            process.exit(1);
        });
}

module.exports = {
    createBusinessUserWithWathiq,
    createBusinessUserManually
};
