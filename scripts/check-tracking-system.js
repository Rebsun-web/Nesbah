const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkTrackingSystem() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking tracking system components...\n');
        
        // Check if application_offer_tracking table exists
        console.log('📊 Step 1: Checking application_offer_tracking table...');
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'application_offer_tracking'
            );
        `);
        
        if (tableExists.rows[0].exists) {
            console.log('✅ application_offer_tracking table exists');
            
            // Check table structure
            const tableStructure = await client.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'application_offer_tracking'
                ORDER BY ordinal_position;
            `);
            
            console.log('📋 Table structure:');
            tableStructure.rows.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
            });
            
            // Check record count
            const recordCount = await client.query('SELECT COUNT(*) FROM application_offer_tracking');
            console.log(`📈 Total tracking records: ${recordCount.rows[0].count}`);
            
        } else {
            console.log('❌ application_offer_tracking table does not exist');
        }
        
        // Check if triggers exist
        console.log('\n📊 Step 2: Checking database triggers...');
        const triggers = await client.query(`
            SELECT trigger_name, event_manipulation, event_object_table, action_statement
            FROM information_schema.triggers 
            WHERE trigger_schema = 'public'
            AND event_object_table IN ('submitted_applications', 'application_offers', 'application_offer_tracking')
            ORDER BY trigger_name;
        `);
        
        if (triggers.rows.length > 0) {
            console.log('✅ Found triggers:');
            triggers.rows.forEach(trigger => {
                console.log(`  - ${trigger.trigger_name} on ${trigger.event_object_table} (${trigger.event_manipulation})`);
            });
        } else {
            console.log('❌ No triggers found');
        }
        
        // Check if functions exist
        console.log('\n📊 Step 3: Checking database functions...');
        const functions = await client.query(`
            SELECT routine_name, routine_type
            FROM information_schema.routines 
            WHERE routine_schema = 'public'
            AND routine_name LIKE '%application%' OR routine_name LIKE '%purchase%' OR routine_name LIKE '%offer%'
            ORDER BY routine_name;
        `);
        
        if (functions.rows.length > 0) {
            console.log('✅ Found functions:');
            functions.rows.forEach(func => {
                console.log(`  - ${func.routine_name} (${func.routine_type})`);
            });
        } else {
            console.log('❌ No relevant functions found');
        }
        
        // Check submitted_applications table structure
        console.log('\n📊 Step 4: Checking submitted_applications table...');
        const appColumns = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'submitted_applications'
            AND column_name IN ('auction_end_time', 'offer_selection_end_time', 'revenue_collected', 'offers_count', 'purchased_by')
            ORDER BY column_name;
        `);
        
        console.log('📋 Key columns in submitted_applications:');
        appColumns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        // Check sample applications for auction timing
        console.log('\n📊 Step 5: Checking sample applications...');
        const sampleApps = await client.query(`
            SELECT application_id, status, auction_end_time, offer_selection_end_time, revenue_collected, offers_count, purchased_by
            FROM submitted_applications 
            ORDER BY submitted_at DESC 
            LIMIT 5;
        `);
        
        console.log('📋 Sample applications:');
        sampleApps.rows.forEach(app => {
            console.log(`  - App ${app.application_id}: status=${app.status}, auction_end=${app.auction_end_time}, revenue=${app.revenue_collected}, offers=${app.offers_count}, purchased_by=${app.purchased_by}`);
        });
        
    } catch (error) {
        console.error('❌ Error checking tracking system:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the check
checkTrackingSystem()
    .then(() => console.log('\n🎉 Tracking system check completed'))
    .catch(error => console.error('❌ Error:', error));
