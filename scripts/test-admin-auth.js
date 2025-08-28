const fetch = require('node-fetch');

async function testAdminAuth() {
    console.log('🔧 Testing Admin Authentication Flow...\n');
    
    // Test 1: Check if admin login endpoint is accessible
    console.log('1. Testing admin login endpoint...');
    try {
        const response = await fetch('http://localhost:3000/api/admin/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@nesbah.com',
                password: 'admin123'
            })
        });
        
        const data = await response.json();
        console.log('   Status:', response.status);
        console.log('   Response:', data);
        
        if (data.success) {
            console.log('   ✅ Admin login successful');
            
            // Test 2: Check if we can access the /me endpoint with the cookie
            console.log('\n2. Testing /me endpoint...');
            const cookies = response.headers.get('set-cookie');
            console.log('   Cookies received:', cookies);
            
            if (cookies) {
                const meResponse = await fetch('http://localhost:3000/api/admin/auth/me', {
                    headers: {
                        'Cookie': cookies
                    }
                });
                
                const meData = await meResponse.json();
                console.log('   /me Status:', meResponse.status);
                console.log('   /me Response:', meData);
            }
        } else {
            console.log('   ❌ Admin login failed:', data.error);
        }
    } catch (error) {
        console.error('   ❌ Error:', error.message);
    }
    
    // Test 3: Check test endpoint
    console.log('\n3. Testing admin test endpoint...');
    try {
        const testResponse = await fetch('http://localhost:3000/api/admin/test');
        const testData = await testResponse.json();
        console.log('   Status:', testResponse.status);
        console.log('   Response:', testData);
    } catch (error) {
        console.error('   ❌ Error:', error.message);
    }
}

testAdminAuth().catch(console.error);
