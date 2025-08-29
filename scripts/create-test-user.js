require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const fetch = require('node-fetch');

async function createTestUser() {
    console.log('🔍 Creating test user...');
    
    const testUserData = {
        email: 'test@business.com',
        password: 'Test123!',
        cr_national_number: '4030000001',
        cr_number: 'CR4030000001',
        trade_name: 'Test Business Company',
        registration_status: 'active',
        address: 'Riyadh, Saudi Arabia',
        sector: 'Technology, Software Development',
        cr_capital: 1000000,
        cash_capital: 500000,
        in_kind_capital: 500000,
        legal_form: 'Limited Liability Company',
        issue_date_gregorian: '2023-01-15',
        confirmation_date_gregorian: '2023-01-20',
        has_ecommerce: true,
        management_structure: 'Board of Directors',
        management_managers: ['Ahmed Al-Rashid', 'Sarah Johnson'],
        contact_info: {
            email: 'contact@testbusiness.com',
            phone: '+966501234567'
        },
        store_url: 'https://testbusiness.com'
    };
    
    try {
        console.log('1. Creating business user...');
        const response = await fetch('http://localhost:3000/api/users/register/business_users/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUserData)
        });
        
        console.log('Registration response status:', response.status);
        const data = await response.json();
        console.log('Registration response:', data);
        
        if (response.ok && data.success) {
            console.log('✅ Test user created successfully!');
            console.log('User ID:', data.data.user_id);
            console.log('Email:', testUserData.email);
            console.log('Password:', testUserData.password);
            
            // Now test login
            console.log('\n2. Testing login...');
            const loginResponse = await fetch('http://localhost:3000/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: testUserData.email,
                    password: testUserData.password
                })
            });
            
            console.log('Login response status:', loginResponse.status);
            const loginData = await loginResponse.json();
            console.log('Login response:', loginData);
            
            if (loginResponse.ok && loginData.success) {
                console.log('✅ Login successful!');
                console.log('User data:', loginData.user);
                
                // Test portal API
                console.log('\n3. Testing portal API...');
                const portalResponse = await fetch(`http://localhost:3000/api/portal/client/${loginData.user.user_id}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                
                console.log('Portal response status:', portalResponse.status);
                const portalData = await portalResponse.json();
                console.log('Portal response:', portalData);
                
                if (portalResponse.ok && portalData.success) {
                    console.log('✅ Portal API working!');
                    console.log('Business data:', portalData.data);
                } else {
                    console.log('❌ Portal API failed:', portalData);
                }
            } else {
                console.log('❌ Login failed:', loginData);
            }
        } else {
            console.log('❌ User creation failed:', data);
        }
        
    } catch (error) {
        console.error('Error creating test user:', error);
    }
}

if (require.main === module) {
    createTestUser();
}

module.exports = { createTestUser };
