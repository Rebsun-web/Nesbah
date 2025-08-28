// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createBusinessUserRecord() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Creating business_user record for user_id: 661...\n');
        
        // First, check if user exists
        const userQuery = await client.query(
            'SELECT user_id, email, user_type FROM users WHERE user_id = $1',
            [661]
        );
        
        if (userQuery.rows.length === 0) {
            console.log('❌ User not found');
            return;
        }
        
        const user = userQuery.rows[0];
        console.log('👤 User found:', user.email);
        
        // Check if business_user record already exists
        const existingQuery = await client.query(
            'SELECT user_id FROM business_users WHERE user_id = $1',
            [661]
        );
        
        if (existingQuery.rows.length > 0) {
            console.log('✅ Business_user record already exists');
            return;
        }
        
        // Find a unique CR number
        const crNumberQuery = await client.query(
            'SELECT cr_national_number FROM business_users ORDER BY cr_national_number DESC LIMIT 1'
        );
        
        let nextCrNumber = '4030000001';
        if (crNumberQuery.rows.length > 0) {
            const lastCrNumber = parseInt(crNumberQuery.rows[0].cr_national_number);
            nextCrNumber = (lastCrNumber + 1).toString();
        }
        
        console.log(`🔢 Using unique CR number: ${nextCrNumber}`);
        
        // Create business_user record
        const insertResult = await client.query(`
            INSERT INTO business_users (
                user_id, cr_national_number, cr_number, trade_name, 
                address, sector, registration_status, cash_capital, 
                in_kind_capital, contact_info, store_url, form_name, 
                issue_date_gregorian, confirmation_date_gregorian, 
                has_ecommerce, management_structure, management_managers, 
                cr_capital, city, contact_person, contact_person_number
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 
                $13, $14, $15, $16, $17, $18, $19, $20, $21
            ) RETURNING user_id, cr_number, trade_name
        `, [
            661, // user_id
            nextCrNumber, // cr_national_number
            `CR${nextCrNumber.slice(-3)}`, // cr_number
            'Test Business Solutions', // trade_name
            'King Fahd Road, Riyadh', // address
            'Technology & Software Development', // sector
            'active', // registration_status
            250000, // cash_capital
            '50000', // in_kind_capital
            JSON.stringify({ 
                phone: '+966501234567', 
                email: user.email,
                website: 'www.testbusiness.sa'
            }), // contact_info
            'https://testbusiness.sa', // store_url
            'Limited Liability Company', // form_name
            '2023-06-15', // issue_date_gregorian
            '2023-06-20', // confirmation_date_gregorian
            true, // has_ecommerce
            'Board of Directors', // management_structure
            JSON.stringify(['Ahmed Al-Rashid', 'Sarah Al-Zahra']), // management_managers
            300000, // cr_capital
            'Riyadh', // city
            'Ahmed Al-Rashid', // contact_person
            '+966501234567' // contact_person_number
        ]);
        
        const newBusinessUser = insertResult.rows[0];
        console.log('✅ Business_user record created successfully!');
        console.log(`   User ID: ${newBusinessUser.user_id}`);
        console.log(`   CR Number: ${newBusinessUser.cr_number}`);
        console.log(`   Trade Name: ${newBusinessUser.trade_name}`);
        
        // Update the user's entity_name
        await client.query(
            'UPDATE users SET entity_name = $1 WHERE user_id = $2',
            [newBusinessUser.trade_name, 661]
        );
        
        console.log('✅ User entity_name updated');
        
    } catch (error) {
        console.error('❌ Error creating business_user record:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    createBusinessUserRecord()
        .then(() => {
            console.log('\n✅ Business user record creation completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Business user record creation failed:', error);
            process.exit(1);
        });
}

module.exports = { createBusinessUserRecord };
