require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Import the Wathiq API service
const WathiqAPIService = require('../src/lib/wathiq-api-service.js').default;

async function updateBusinessUsersWithWathiq() {
    console.log('🔄 Updating business users with comprehensive Wathiq data...');
    
    const client = await pool.connect();
    
    try {
        // Get all business users that have CR national numbers
        const result = await client.query(`
            SELECT user_id, cr_national_number, trade_name, registration_status
            FROM business_users 
            WHERE cr_national_number IS NOT NULL 
            AND cr_national_number != ''
            ORDER BY user_id
        `);
        
        console.log(`📊 Found ${result.rows.length} business users to update`);
        
        let updatedCount = 0;
        let errorCount = 0;
        
        for (const businessUser of result.rows) {
            try {
                console.log(`\n🔍 Processing: ${businessUser.trade_name} (CR: ${businessUser.cr_national_number})`);
                
                // Fetch comprehensive data from Wathiq API
                const wathiqData = await WathiqAPIService.fetchBusinessData(businessUser.cr_national_number, 'en');
                
                // Update the business user with comprehensive data
                await client.query(`
                    UPDATE business_users SET
                        cr_number = COALESCE($1, cr_number),
                        trade_name = COALESCE($2, trade_name),
                        registration_status = COALESCE($3, registration_status),
                        address = COALESCE($4, address),
                        city = COALESCE($5, city),
                        sector = COALESCE($6, sector),
                        cr_capital = COALESCE($7, cr_capital),
                        cash_capital = COALESCE($8, cash_capital),
                        in_kind_capital = COALESCE($9, in_kind_capital),
                        avg_capital = COALESCE($10, avg_capital),
                        legal_form = COALESCE($11, legal_form),
                        issue_date_gregorian = COALESCE($12, issue_date_gregorian),
                        confirmation_date_gregorian = COALESCE($13, confirmation_date_gregorian),
                        has_ecommerce = COALESCE($14, has_ecommerce),
                        store_url = COALESCE($15, store_url),
                        management_structure = COALESCE($16, management_structure),
                        management_managers = COALESCE($17, management_managers),
                        activities = COALESCE($18, activities),
                        contact_info = COALESCE($19, contact_info),
                        is_verified = COALESCE($20, is_verified),
                        verification_date = COALESCE($21, verification_date),
                        admin_notes = COALESCE($22, admin_notes)
                    WHERE user_id = $23
                `, [
                    wathiqData.cr_number,
                    wathiqData.trade_name,
                    wathiqData.registration_status,
                    wathiqData.address,
                    wathiqData.city,
                    wathiqData.sector,
                    wathiqData.cr_capital,
                    wathiqData.cash_capital,
                    wathiqData.in_kind_capital,
                    wathiqData.avg_capital,
                    wathiqData.legal_form,
                    wathiqData.issue_date_gregorian,
                    wathiqData.confirmation_date_gregorian,
                    wathiqData.has_ecommerce,
                    wathiqData.store_url,
                    wathiqData.management_structure,
                    wathiqData.management_managers ? JSON.stringify(wathiqData.management_managers) : null,
                    wathiqData.activities ? wathiqData.activities : null,
                    wathiqData.contact_info ? JSON.stringify(wathiqData.contact_info) : null,
                    wathiqData.is_verified,
                    wathiqData.verification_date,
                    wathiqData.admin_notes,
                    businessUser.user_id
                ]);
                
                console.log(`✅ Updated: ${businessUser.trade_name}`);
                updatedCount++;
                
                // Add a small delay to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`❌ Error updating ${businessUser.trade_name}:`, error.message);
                errorCount++;
            }
        }
        
        console.log(`\n🎉 Update completed!`);
        console.log(`✅ Successfully updated: ${updatedCount} business users`);
        console.log(`❌ Errors: ${errorCount} business users`);
        
    } catch (error) {
        console.error('❌ Error in update process:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Test the Wathiq API service first
async function testWathiqService() {
    console.log('🧪 Testing Wathiq API service...');
    
    try {
        // Test with a known CR number
        const testCR = '7000025036';
        const testData = await WathiqAPIService.fetchBusinessData(testCR, 'en');
        
        console.log('✅ Wathiq API service test successful');
        console.log('📊 Sample data structure:');
        console.log(JSON.stringify(testData, null, 2));
        
        return true;
    } catch (error) {
        console.error('❌ Wathiq API service test failed:', error);
        return false;
    }
}

// Main execution
async function main() {
    console.log('🚀 Starting business users update with Wathiq data...\n');
    
    // Test the service first
    const serviceTest = await testWathiqService();
    
    if (!serviceTest) {
        console.log('❌ Service test failed. Aborting update.');
        return;
    }
    
    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question('\n⚠️  This will update all business users with Wathiq data. Continue? (y/N): ', async (answer) => {
        rl.close();
        
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            await updateBusinessUsersWithWathiq();
        } else {
            console.log('❌ Update cancelled.');
        }
    });
}

main().catch(console.error);
