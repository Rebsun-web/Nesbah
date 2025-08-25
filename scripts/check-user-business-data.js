// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkUserBusinessData() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking user business data for user_id: 661...\n');
        
        // Check if user exists
        const userQuery = await client.query(
            'SELECT user_id, email, user_type, entity_name FROM users WHERE user_id = $1',
            [661]
        );
        
        if (userQuery.rows.length === 0) {
            console.log('❌ User not found');
            return;
        }
        
        const user = userQuery.rows[0];
        console.log('👤 User found:');
        console.log(`   ID: ${user.user_id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Type: ${user.user_type}`);
        console.log(`   Entity: ${user.entity_name}`);
        
        // Check if business_user record exists
        const businessQuery = await client.query(
            'SELECT * FROM business_users WHERE user_id = $1',
            [661]
        );
        
        if (businessQuery.rows.length === 0) {
            console.log('\n❌ No business_user record found!');
            console.log('🔧 This is why the portal client API returns 404');
            
            // Check what business_users table structure looks like
            const tableInfo = await client.query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'business_users' 
                ORDER BY ordinal_position
            `);
            
            console.log('\n📋 Business_users table structure:');
            tableInfo.rows.forEach(col => {
                console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'required'})`);
            });
            
            // Check if we can create a basic business_user record
            console.log('\n🔧 Creating basic business_user record...');
            
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
                ) RETURNING user_id
            `, [
                661, // user_id
                '4030000001', // cr_national_number
                'CR001', // cr_number
                user.entity_name || 'Test Business', // trade_name
                'Test Address', // address
                'Technology', // sector
                'active', // registration_status
                100000, // cash_capital
                50000, // in_kind_capital
                JSON.stringify({ phone: '+966501234567', email: user.email }), // contact_info
                null, // store_url
                'Limited Liability Company', // form_name
                '2023-01-01', // issue_date_gregorian
                '2023-01-05', // confirmation_date_gregorian
                false, // has_ecommerce
                'Owner', // management_structure
                JSON.stringify(['Test Manager']), // management_managers
                150000, // cr_capital
                'Riyadh', // city
                'Test Contact', // contact_person
                '+966501234567' // contact_person_number
            ]);
            
            console.log('✅ Basic business_user record created successfully!');
            console.log(`   Business user ID: ${insertResult.rows[0].user_id}`);
            
        } else {
            console.log('\n✅ Business_user record found:');
            const businessUser = businessQuery.rows[0];
            console.log(`   CR Number: ${businessUser.cr_number}`);
            console.log(`   Trade Name: ${businessUser.trade_name}`);
            console.log(`   City: ${businessUser.city}`);
            console.log(`   Status: ${businessUser.registration_status}`);
        }
        
    } catch (error) {
        console.error('❌ Error checking user business data:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    checkUserBusinessData()
        .then(() => {
            console.log('\n✅ User business data check completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 User business data check failed:', error);
            process.exit(1);
        });
}

module.exports = { checkUserBusinessData };
