// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const bcrypt = require('bcrypt');

// Test credentials for different user types
const credentials = {
    business: {
        email: 'cr001@nesbah.com',
        password: 'changeme123'
    },
    bank: {
        email: 'sbn@bank.com',
        password: 'SBN@2024!'
    },
    admin: {
        email: 'admin@test.com',
        password: 'admin123' // This might be the plain text version
    },
    testBusiness: {
        email: 'test2@business.com',
        password: 'password123'
    }
};

async function testCredentials() {
    console.log('🔐 Testing login credentials...\n');
    
    for (const [userType, creds] of Object.entries(credentials)) {
        console.log(`📧 Testing ${userType} user: ${creds.email}`);
        console.log(`🔑 Password: ${creds.password}`);
        console.log('---');
    }
    
    console.log('\n💡 To test these credentials:');
    console.log('1. Go to the login page');
    console.log('2. Try the business user: cr001@nesbah.com / changeme123');
    console.log('3. Try the bank user: sbn@bank.com / SBN@2024!');
    console.log('4. Try the test business user: test2@business.com / password123');
    console.log('\n⚠️  Note: Admin users use a separate login system at /admin/login');
}

// Run if called directly
if (require.main === module) {
    testCredentials()
        .then(() => {
            console.log('\n✅ Credential testing completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Credential testing failed:', error);
            process.exit(1);
        });
}

module.exports = { testCredentials };
