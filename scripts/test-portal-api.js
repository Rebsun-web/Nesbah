require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const fetch = require('node-fetch');

async function testPortalAPI() {
    console.log('🔍 Testing Portal API...');
    
    // Test with a known business user
    const testUserId = 1000; // From the debug output - this user has password Business123!
    const testEmail = 'nikitamail@nesbah.com';
    
    console.log(`Testing with user_id: ${testUserId}, email: ${testEmail}`);
    
    try {
        // First, let's try to login to get a proper session
        console.log('\n1. Testing login...');
        const loginResponse = await fetch('http://localhost:3000/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: 'Business123!'
            })
        });
        
        console.log('Login response status:', loginResponse.status);
        const loginData = await loginResponse.json();
        console.log('Login response:', loginData);
        
        if (loginResponse.ok && loginData.success) {
            // Get cookies from login response
            const cookies = loginResponse.headers.get('set-cookie');
            console.log('Cookies received:', cookies);
            
            // Now test the portal API
            console.log('\n2. Testing portal API...');
            const portalResponse = await fetch(`http://localhost:3000/api/portal/client/${testUserId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookies || ''
                }
            });
            
            console.log('Portal response status:', portalResponse.status);
            const portalData = await portalResponse.json();
            console.log('Portal response:', portalData);
            
        } else {
            console.log('Login failed, cannot test portal API');
        }
        
    } catch (error) {
        console.error('Error testing portal API:', error);
    }
}

if (require.main === module) {
    testPortalAPI();
}

module.exports = { testPortalAPI };
