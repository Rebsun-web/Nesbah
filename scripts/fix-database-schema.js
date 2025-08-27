#!/usr/bin/env node

/**
 * Fix Database Schema Script
 * This script fixes missing fields and ensures database schema consistency
 */

const { Pool } = require('pg');

console.log('🔧 Starting Database Schema Fix Script...\n');

// Database configuration
const poolConfig = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
} : {
  host: '34.166.77.134',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Riyadh123!@#',
  ssl: {
    rejectUnauthorized: false,
  },
};

async function fixDatabaseSchema() {
    let pool = null;
    
    try {
        console.log('📊 Connecting to database...');
        pool = new Pool(poolConfig);
        
        // Test connection
        const client = await pool.connect();
        console.log('✅ Database connected successfully');
        
        console.log('\n🔍 Step 1: Checking current database schema...');
        
        // Check if application_offer_tracking table exists
        const tableExistsQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'application_offer_tracking'
            );
        `;
        
        const tableExists = await client.query(tableExistsQuery);
        
        if (!tableExists.rows[0].exists) {
            console.log('❌ application_offer_tracking table does not exist. Creating it...');
            
            // Create the table with all required fields
            await client.query(`
                CREATE TABLE application_offer_tracking (
                    id SERIAL PRIMARY KEY,
                    application_id INTEGER NOT NULL,
                    business_user_id INTEGER NOT NULL,
                    bank_user_id INTEGER NOT NULL,
                    application_submitted_at TIMESTAMP,
                    application_window_start TIMESTAMP,
                    application_window_end TIMESTAMP,
                    offer_window_start TIMESTAMP,
                    offer_window_end TIMESTAMP,
                    current_application_status VARCHAR(50) DEFAULT 'live_auction',
                    purchased_at TIMESTAMP,
                    offer_sent_at TIMESTAMP,
                    offer_accepted_at TIMESTAMP,
                    offer_rejected_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `);
            
            console.log('✅ Created application_offer_tracking table');
        } else {
            console.log('✅ application_offer_tracking table exists');
            
            // Check if required fields exist
            const columnsQuery = `
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'application_offer_tracking'
                ORDER BY ordinal_position;
            `;
            
            const columns = await client.query(columnsQuery);
            console.log('\n📋 Current columns in application_offer_tracking:');
            columns.rows.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
            });
            
            // Check for missing fields
            const requiredFields = [
                'application_window_end',
                'application_window_start',
                'offer_window_start',
                'offer_window_end',
                'current_application_status',
                'purchased_at',
                'offer_sent_at',
                'offer_accepted_at',
                'offer_rejected_at'
            ];
            
            const existingFields = columns.rows.map(col => col.column_name);
            const missingFields = requiredFields.filter(field => !existingFields.includes(field));
            
            if (missingFields.length > 0) {
                console.log(`\n⚠️  Missing fields: ${missingFields.join(', ')}`);
                console.log('🔧 Adding missing fields...');
                
                for (const field of missingFields) {
                    let fieldDefinition = '';
                    switch (field) {
                        case 'application_window_end':
                        case 'application_window_start':
                        case 'offer_window_start':
                        case 'offer_window_end':
                        case 'purchased_at':
                        case 'offer_sent_at':
                        case 'offer_accepted_at':
                        case 'offer_rejected_at':
                            fieldDefinition = 'TIMESTAMP';
                            break;
                        case 'current_application_status':
                            fieldDefinition = 'VARCHAR(50) DEFAULT \'live_auction\'';
                            break;
                        default:
                            fieldDefinition = 'TIMESTAMP';
                    }
                    
                    try {
                        await client.query(`ALTER TABLE application_offer_tracking ADD COLUMN ${field} ${fieldDefinition};`);
                        console.log(`✅ Added ${field} field`);
                    } catch (error) {
                        if (error.code === '42701') { // Column already exists
                            console.log(`⚠️  Field ${field} already exists`);
                        } else {
                            console.error(`❌ Failed to add ${field}:`, error.message);
                        }
                    }
                }
            } else {
                console.log('✅ All required fields exist');
            }
        }
        
        console.log('\n🔍 Step 2: Checking for database triggers...');
        
        // Check if the problematic trigger exists
        const triggerQuery = `
            SELECT trigger_name, event_object_table, action_statement
            FROM information_schema.triggers 
            WHERE trigger_name = 'handle_application_purchase'
            OR trigger_name LIKE '%application_purchase%';
        `;
        
        const triggers = await client.query(triggerQuery);
        
        if (triggers.rows.length > 0) {
            console.log('⚠️  Found potentially problematic triggers:');
            triggers.rows.forEach(trigger => {
                console.log(`   - ${trigger.trigger_name} on ${trigger.event_object_table}`);
            });
            
            // Drop the problematic trigger if it exists
            try {
                await client.query('DROP TRIGGER IF EXISTS handle_application_purchase ON application_offers;');
                console.log('✅ Dropped handle_application_purchase trigger');
            } catch (error) {
                console.log('⚠️  Could not drop trigger (may not exist):', error.message);
            }
        } else {
            console.log('✅ No problematic triggers found');
        }
        
        console.log('\n🔍 Step 3: Ensuring consistent data...');
        
        // Check if there are applications that need tracking records
        const missingTrackingQuery = `
            SELECT DISTINCT sa.application_id, sa.business_user_id, sa.submitted_at
            FROM submitted_applications sa
            LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
            WHERE aot.application_id IS NULL
            AND sa.status = 'live_auction'
            LIMIT 100;
        `;
        
        const missingTracking = await client.query(missingTrackingQuery);
        
        if (missingTracking.rows.length > 0) {
            console.log(`📋 Found ${missingTracking.rows.length} applications missing tracking records`);
            
            // Get all bank users
            const bankUsersQuery = 'SELECT user_id FROM users WHERE user_type = $1';
            const bankUsers = await client.query(bankUsersQuery, ['bank_user']);
            
            if (bankUsers.rows.length > 0) {
                console.log(`🔧 Creating tracking records for ${missingTracking.rows.length} applications...`);
                
                let createdCount = 0;
                for (const app of missingTracking.rows) {
                    try {
                        // Create tracking records for all bank users
                        for (const bankUser of bankUsers.rows) {
                            await client.query(`
                                INSERT INTO application_offer_tracking (
                                    application_id,
                                    business_user_id,
                                    bank_user_id,
                                    application_submitted_at,
                                    application_window_start,
                                    application_window_end,
                                    current_application_status
                                ) VALUES ($1, $2, $3, $4, $4, $4 + INTERVAL '48 hours', 'live_auction')
                                ON CONFLICT (application_id, bank_user_id) DO NOTHING
                            `, [app.application_id, app.business_user_id, bankUser.user_id, app.submitted_at]);
                        }
                        createdCount++;
                    } catch (error) {
                        console.error(`❌ Failed to create tracking for application ${app.application_id}:`, error.message);
                    }
                }
                
                console.log(`✅ Created tracking records for ${createdCount} applications`);
            }
        } else {
            console.log('✅ All applications have tracking records');
        }
        
        console.log('\n🔍 Step 4: Verifying schema consistency...');
        
        // Final verification
        const verificationQuery = `
            SELECT 
                COUNT(*) as total_applications,
                COUNT(CASE WHEN aot.application_window_end IS NOT NULL THEN 1 END) as with_window_end,
                COUNT(CASE WHEN aot.current_application_status IS NOT NULL THEN 1 END) as with_status
            FROM submitted_applications sa
            LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
            WHERE sa.status = 'live_auction';
        `;
        
        const verification = await client.query(verificationQuery);
        const stats = verification.rows[0];
        
        console.log('📊 Schema verification results:');
        console.log(`   Total live_auction applications: ${stats.total_applications}`);
        console.log(`   Applications with window_end: ${stats.with_window_end}`);
        console.log(`   Applications with status: ${stats.with_status}`);
        
        if (stats.total_applications > 0 && stats.with_window_end === stats.total_applications) {
            console.log('✅ Schema is consistent!');
        } else {
            console.log('⚠️  Schema may still have inconsistencies');
        }
        
        console.log('\n🔍 Step 5: Fixing missing columns in other tables...');
        
        // Check and fix bank_offer_submissions table
        const bankOfferSubmissionsColumnsQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'bank_offer_submissions'
            ORDER BY ordinal_position;
        `;
        
        const bankOfferSubmissionsColumns = await client.query(bankOfferSubmissionsColumnsQuery);
        
        if (bankOfferSubmissionsColumns.rows.length === 0) {
            console.log('❌ bank_offer_submissions table does not exist. Creating it...');
            await client.query(`
                CREATE TABLE bank_offer_submissions (
                    id SERIAL PRIMARY KEY,
                    application_id INTEGER NOT NULL,
                    bank_user_id INTEGER NOT NULL,
                    offer_id INTEGER NOT NULL,
                    first_viewed_at TIMESTAMP,
                    time_to_submit_minutes DECIMAL(10,2),
                    submitted_at TIMESTAMP DEFAULT NOW(),
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `);
            console.log('✅ Created bank_offer_submissions table');
        } else {
            console.log('✅ bank_offer_submissions table exists');
            
            const existingColumns = bankOfferSubmissionsColumns.rows.map(col => col.column_name);
            const requiredColumns = ['first_viewed_at', 'time_to_submit_minutes'];
            const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
            
            if (missingColumns.length > 0) {
                console.log(`⚠️  Missing columns: ${missingColumns.join(', ')}`);
                for (const col of missingColumns) {
                    try {
                        if (col === 'time_to_submit_minutes') {
                            await client.query(`ALTER TABLE bank_offer_submissions ADD COLUMN ${col} DECIMAL(10,2);`);
                        } else {
                            await client.query(`ALTER TABLE bank_offer_submissions ADD COLUMN ${col} TIMESTAMP;`);
                        }
                        console.log(`✅ Added ${col} column`);
                    } catch (error) {
                        if (error.code === '42701') {
                            console.log(`⚠️  Column ${col} already exists`);
                        } else {
                            console.error(`❌ Failed to add ${col}:`, error.message);
                        }
                    }
                }
            } else {
                console.log('✅ All required columns exist in bank_offer_submissions');
            }
        }
        
        // Check and fix pos_application status constraint
        console.log('\n🔍 Step 6: Fixing status constraints...');
        
        const posApplicationConstraintsQuery = `
            SELECT constraint_name, check_clause
            FROM information_schema.check_constraints 
            WHERE constraint_name = 'pos_application_status_check';
        `;
        
        const posApplicationConstraints = await client.query(posApplicationConstraintsQuery);
        
        if (posApplicationConstraints.rows.length > 0) {
            console.log('⚠️  Found pos_application_status_check constraint');
            console.log('🔧 Dropping old constraint to fix status issues...');
            
            try {
                await client.query('ALTER TABLE pos_application DROP CONSTRAINT IF EXISTS pos_application_status_check;');
                console.log('✅ Dropped old status constraint');
                
                // Add new constraint with correct statuses
                await client.query(`
                    ALTER TABLE pos_application 
                    ADD CONSTRAINT pos_application_status_check 
                    CHECK (status IN ('live_auction', 'approved_leads', 'complete', 'ignored'));
                `);
                console.log('✅ Added new status constraint');
            } catch (error) {
                console.error('❌ Failed to update constraint:', error.message);
            }
        } else {
            console.log('✅ No problematic status constraints found');
        }
        
        client.release();
        
    } catch (error) {
        console.error('❌ Error during database schema fix:', error.message);
        
        if (pool) {
            try {
                await pool.end();
            } catch (endError) {
                console.error('❌ Failed to end pool:', endError.message);
            }
        }
        
        process.exit(1);
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

// Run the fix
fixDatabaseSchema().then(() => {
    console.log('\n🎉 Database schema fix script completed successfully!');
    process.exit(0);
}).catch((error) => {
    console.error('\n💥 Database schema fix script failed:', error);
    process.exit(1);
});
