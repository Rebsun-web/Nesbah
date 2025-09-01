#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { execSync } = require('child_process');
const fetch = require('node-fetch');
const readline = require('readline');

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to generate secure password using macOS
function generateSecurePassword() {
    try {
        // Use macOS's built-in password generation
        const password = execSync('openssl rand -base64 12', { encoding: 'utf8' }).trim();
        // Remove any non-alphanumeric characters and limit to 16 characters
        return password.replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    } catch (error) {
        console.log('⚠️  Could not generate password using openssl, using fallback method...');
        // Fallback: generate a simple secure password
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 16; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
}

// Function to prompt user for input
function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

// Function to create user with secure password
async function createUserWithSecurePassword() {
    try {
        console.log('🚀 Create User with Secure Password\n');

        if (!ADMIN_TOKEN) {
            console.log('❌ ADMIN_TOKEN environment variable is required');
            console.log('   Please set it to a valid admin session token');
            process.exit(1);
        }

        // Get user details
        const userType = await askQuestion('User type (business/individual/bank): ');
        const email = await askQuestion('Email: ');
        const entityName = await askQuestion('Entity name (or press Enter to skip): ');
        
        let firstName = '';
        let lastName = '';
        
        if (userType === 'individual') {
            firstName = await askQuestion('First name: ');
            lastName = await askQuestion('Last name: ');
        }

        const registrationStatus = await askQuestion('Registration status (active/inactive, default: active): ') || 'active';

        // Generate secure password
        console.log('\n🔐 Generating secure password...');
        const securePassword = generateSecurePassword();
        console.log(`✅ Generated password: ${securePassword}`);

        // Confirm password
        const confirmPassword = await askQuestion('\nWould you like to use this password? (y/n, or type a custom password): ');
        
        let finalPassword = securePassword;
        if (confirmPassword.toLowerCase() === 'n') {
            finalPassword = await askQuestion('Enter custom password: ');
        } else if (confirmPassword.toLowerCase() !== 'y' && confirmPassword !== '') {
            finalPassword = confirmPassword;
        }

        // Prepare user data
        const userData = {
            user_type: userType,
            email: email,
            password: finalPassword,
            registration_status: registrationStatus
        };

        if (entityName) {
            userData.entity_name = entityName;
        }

        if (userType === 'individual') {
            userData.first_name = firstName;
            userData.last_name = lastName;
        }

        console.log('\n📤 Creating user...');

        // Create user via API
        const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `admin_token=${ADMIN_TOKEN}`
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ User created successfully!');
            console.log('\n📊 User Details:');
            console.log(`   User ID: ${result.data.user_id}`);
            console.log(`   Email: ${result.data.email}`);
            console.log(`   User Type: ${result.data.user_type}`);
            console.log(`   Password: ${result.data.password}`);
            console.log(`   Registration Status: ${result.data.registration_status}`);
            console.log(`   Created At: ${result.data.timestamp}`);
            
            console.log('\n🔑 Login Credentials:');
            console.log(`   Email: ${result.data.email}`);
            console.log(`   Password: ${result.data.password}`);
            
            console.log('\n💡 You can now login with these credentials at your application login page.');
            
        } else {
            console.log('❌ Failed to create user:');
            console.log(`   Error: ${result.error}`);
        }

    } catch (error) {
        console.error('💥 Error creating user:', error);
    } finally {
        rl.close();
    }
}

// Function to create multiple users with secure passwords
async function createMultipleUsers() {
    try {
        console.log('🚀 Create Multiple Users with Secure Passwords\n');

        if (!ADMIN_TOKEN) {
            console.log('❌ ADMIN_TOKEN environment variable is required');
            process.exit(1);
        }

        const count = parseInt(await askQuestion('How many users to create? ')) || 1;
        const userType = await askQuestion('User type for all users (business/individual/bank): ');
        const baseEmail = await askQuestion('Base email (e.g., user@example.com): ');
        const baseEntityName = await askQuestion('Base entity name (e.g., Test Company): ');

        const users = [];

        for (let i = 1; i <= count; i++) {
            console.log(`\n📝 Creating user ${i}/${count}...`);
            
            const email = baseEmail.replace('@', `${i}@`);
            const entityName = `${baseEntityName} ${i}`;
            const securePassword = generateSecurePassword();

            const userData = {
                user_type: userType,
                email: email,
                password: securePassword,
                entity_name: entityName,
                registration_status: 'active'
            };

            if (userType === 'individual') {
                userData.first_name = `User${i}`;
                userData.last_name = 'Test';
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': `admin_token=${ADMIN_TOKEN}`
                    },
                    body: JSON.stringify(userData)
                });

                const result = await response.json();

                if (result.success) {
                    users.push({
                        email: result.data.email,
                        password: result.data.password,
                        user_id: result.data.user_id
                    });
                    console.log(`✅ Created: ${email}`);
                } else {
                    console.log(`❌ Failed to create ${email}: ${result.error}`);
                }
            } catch (error) {
                console.log(`❌ Error creating ${email}: ${error.message}`);
            }
        }

        if (users.length > 0) {
            console.log('\n📋 Created Users Summary:');
            console.log('Email\t\t\tPassword\t\t\tUser ID');
            console.log('-----\t\t\t--------\t\t\t-------');
            users.forEach(user => {
                console.log(`${user.email}\t${user.password}\t${user.user_id}`);
            });
        }

    } catch (error) {
        console.error('💥 Error creating multiple users:', error);
    } finally {
        rl.close();
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const mode = args[0] || 'single';

    try {
        if (mode === 'single') {
            await createUserWithSecurePassword();
        } else if (mode === 'multiple') {
            await createMultipleUsers();
        } else {
            console.log('❌ Invalid mode. Use "single" or "multiple"');
            console.log('   Usage: node create-user-with-secure-password.js [single|multiple]');
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
    generateSecurePassword,
    createUserWithSecurePassword,
    createMultipleUsers
};
