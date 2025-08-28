const fetch = require('node-fetch');

async function testAuthFlow() {
    console.log('🔧 Testing Authentication Flow...\n');
    
    // Step 1: Test admin login
    console.log('1. Testing admin login...');
    try {
        const loginResponse = await fetch('http://localhost:3000/api/admin/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@nesbah.com',
                password: 'admin123'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('   Login Status:', loginResponse.status);
        console.log('   Login Success:', loginData.success);
        
        if (loginData.success) {
            console.log('   ✅ Admin login successful');
            
            // Step 2: Test /me endpoint with cookies
            console.log('\n2. Testing /me endpoint...');
            const cookies = loginResponse.headers.get('set-cookie');
            
            if (cookies) {
                const meResponse = await fetch('http://localhost:3000/api/admin/auth/me', {
                    headers: {
                        'Cookie': cookies
                    }
                });
                
                const meData = await meResponse.json();
                console.log('   /me Status:', meResponse.status);
                console.log('   /me Success:', meData.success);
                
                if (meData.success) {
                    console.log('   ✅ /me endpoint working');
                } else {
                    console.log('   ❌ /me endpoint failed:', meData.error);
                }
            }
            
            // Step 3: Test admin test endpoint
            console.log('\n3. Testing admin test endpoint...');
            const testResponse = await fetch('http://localhost:3000/api/admin/test', {
                headers: {
                    'Cookie': cookies
                }
            });
            
            const testData = await testResponse.json();
            console.log('   Test Status:', testResponse.status);
            console.log('   Test Success:', testData.success);
            
            if (testData.success) {
                console.log('   ✅ Admin test endpoint working');
            } else {
                console.log('   ❌ Admin test endpoint failed:', testData.error);
            }
            
            // Step 4: Test status dashboard
            console.log('\n4. Testing status dashboard...');
            const dashboardResponse = await fetch('http://localhost:3000/api/admin/applications/status-dashboard', {
                headers: {
                    'Cookie': cookies
                }
            });
            
            const dashboardData = await dashboardResponse.json();
            console.log('   Dashboard Status:', dashboardResponse.status);
            console.log('   Dashboard Success:', dashboardData.success);
            
            if (dashboardData.success) {
                console.log('   ✅ Status dashboard working');
            } else {
                console.log('   ❌ Status dashboard failed:', dashboardData.error);
            }
            
        } else {
            console.log('   ❌ Admin login failed:', loginData.error);
        }
    } catch (error) {
        console.error('   ❌ Error:', error.message);
    }
    
    console.log('\n🎯 Authentication Flow Test Complete');
}

testAuthFlow().catch(console.error);
