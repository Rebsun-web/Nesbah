#!/usr/bin/env node

/**
 * Remove All Triggers Script
 * This script finds and removes all database triggers and functions that might be causing errors
 */

const { Pool } = require('pg');

console.log('🔧 Starting Remove All Triggers Script...\n');

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

async function removeAllTriggers() {
    let pool = null;
    
    try {
        console.log('📊 Connecting to database...');
        pool = new Pool(poolConfig);
        
        // Test connection
        const client = await pool.connect();
        console.log('✅ Database connected successfully');
        
        console.log('\n🔍 Step 1: Finding all triggers...');
        
        // Find all triggers
        const allTriggersQuery = `
            SELECT 
                trigger_name,
                event_object_table,
                action_statement,
                action_timing,
                event_manipulation
            FROM information_schema.triggers 
            ORDER BY event_object_table, trigger_name;
        `;
        
        const allTriggers = await client.query(allTriggersQuery);
        
        if (allTriggers.rows.length === 0) {
            console.log('✅ No triggers found in the database');
        } else {
            console.log(`📋 Found ${allTriggers.rows.length} triggers:`);
            allTriggers.rows.forEach(trigger => {
                console.log(`   - ${trigger.trigger_name} on ${trigger.event_object_table} (${trigger.event_manipulation})`);
            });
        }
        
        console.log('\n🔍 Step 2: Finding all functions...');
        
        // Find all functions
        const allFunctionsQuery = `
            SELECT 
                routine_name,
                routine_type,
                routine_definition
            FROM information_schema.routines 
            WHERE routine_schema = 'public'
            ORDER BY routine_name;
        `;
        
        const allFunctions = await client.query(allFunctionsQuery);
        
        if (allFunctions.rows.length === 0) {
            console.log('✅ No functions found in the database');
        } else {
            console.log(`📋 Found ${allFunctions.rows.length} functions:`);
            allFunctions.rows.forEach(func => {
                console.log(`   - ${func.routine_name} (${func.routine_type})`);
            });
        }
        
        console.log('\n🔍 Step 3: Looking for problematic triggers and functions...');
        
        // Look for triggers that might be related to application purchases
        const problematicTriggers = allTriggers.rows.filter(trigger => 
            trigger.trigger_name.toLowerCase().includes('application') ||
            trigger.trigger_name.toLowerCase().includes('purchase') ||
            trigger.trigger_name.toLowerCase().includes('offer') ||
            trigger.trigger_name.toLowerCase().includes('lead')
        );
        
        if (problematicTriggers.length > 0) {
            console.log(`⚠️  Found ${problematicTriggers.length} potentially problematic triggers:`);
            problematicTriggers.forEach(trigger => {
                console.log(`   - ${trigger.trigger_name} on ${trigger.event_object_table}`);
            });
            
            console.log('\n🔧 Removing problematic triggers...');
            
            for (const trigger of problematicTriggers) {
                try {
                    await client.query(`DROP TRIGGER IF EXISTS ${trigger.trigger_name} ON ${trigger.event_object_table};`);
                    console.log(`✅ Dropped trigger ${trigger.trigger_name} on ${trigger.event_object_table}`);
                } catch (error) {
                    console.error(`❌ Failed to drop trigger ${trigger.trigger_name}:`, error.message);
                }
            }
        } else {
            console.log('✅ No problematic triggers found');
        }
        
        // Look for functions that might be related to application purchases
        const problematicFunctions = allFunctions.rows.filter(func => 
            func.routine_name.toLowerCase().includes('application') ||
            func.routine_name.toLowerCase().includes('purchase') ||
            func.routine_name.toLowerCase().includes('offer') ||
            func.routine_name.toLowerCase().includes('lead') ||
            func.routine_name.toLowerCase().includes('handle') ||
            func.routine_name.toLowerCase().includes('calculate') ||
            func.routine_name.toLowerCase().includes('window') ||
            func.routine_name.toLowerCase().includes('auction') ||
            func.routine_name.toLowerCase().includes('revenue') ||
            func.routine_name.toLowerCase().includes('commission')
        );
        
        if (problematicFunctions.length > 0) {
            console.log(`⚠️  Found ${problematicFunctions.length} potentially problematic functions:`);
            problematicFunctions.forEach(func => {
                console.log(`   - ${func.routine_name} (${func.routine_type})`);
            });
            
            console.log('\n🔧 Removing problematic functions...');
            
            for (const func of problematicFunctions) {
                try {
                    // Try to drop with CASCADE first
                    await client.query(`DROP FUNCTION IF EXISTS ${func.routine_name}() CASCADE;`);
                    console.log(`✅ Dropped function ${func.routine_name} with CASCADE`);
                } catch (error) {
                    try {
                        // If CASCADE fails, try without it
                        await client.query(`DROP FUNCTION IF EXISTS ${func.routine_name}();`);
                        console.log(`✅ Dropped function ${func.routine_name}`);
                    } catch (secondError) {
                        console.error(`❌ Failed to drop function ${func.routine_name}:`, secondError.message);
                    }
                }
            }
        } else {
            console.log('✅ No problematic functions found');
        }
        
        // Also remove any remaining triggers that might be problematic
        const remainingTriggersAfterFunctionRemoval = await client.query(allTriggersQuery);
        const stillProblematicTriggers = remainingTriggersAfterFunctionRemoval.rows.filter(trigger => 
            trigger.trigger_name.toLowerCase().includes('application') ||
            trigger.trigger_name.toLowerCase().includes('purchase') ||
            trigger.trigger_name.toLowerCase().includes('offer') ||
            trigger.trigger_name.toLowerCase().includes('lead') ||
            trigger.trigger_name.toLowerCase().includes('calculate') ||
            trigger.trigger_name.toLowerCase().includes('window') ||
            trigger.trigger_name.toLowerCase().includes('auction') ||
            trigger.trigger_name.toLowerCase().includes('revenue') ||
            trigger.trigger_name.toLowerCase().includes('commission')
        );
        
        if (stillProblematicTriggers.length > 0) {
            console.log(`\n⚠️  Found ${stillProblematicTriggers.length} remaining problematic triggers:`);
            stillProblematicTriggers.forEach(trigger => {
                console.log(`   - ${trigger.trigger_name} on ${trigger.event_object_table}`);
            });
            
            console.log('\n🔧 Removing remaining problematic triggers...');
            
            for (const trigger of stillProblematicTriggers) {
                try {
                    await client.query(`DROP TRIGGER IF EXISTS ${trigger.trigger_name} ON ${trigger.event_object_table};`);
                    console.log(`✅ Dropped trigger ${trigger.trigger_name} on ${trigger.event_object_table}`);
                } catch (error) {
                    console.error(`❌ Failed to drop trigger ${trigger.trigger_name}:`, error.message);
                }
            }
        }
        
        // Final cleanup - remove any triggers that might be causing issues
        console.log('\n🔧 Final cleanup - removing any remaining potentially problematic triggers...');
        
        const finalTriggersCheck = await client.query(allTriggersQuery);
        const finalProblematicTriggers = finalTriggersCheck.rows.filter(trigger => 
            trigger.trigger_name.toLowerCase().includes('application') ||
            trigger.trigger_name.toLowerCase().includes('purchase') ||
            trigger.trigger_name.toLowerCase().includes('offer') ||
            trigger.trigger_name.toLowerCase().includes('lead') ||
            trigger.trigger_name.toLowerCase().includes('calculate') ||
            trigger.trigger_name.toLowerCase().includes('window') ||
            trigger.trigger_name.toLowerCase().includes('auction') ||
            trigger.trigger_name.toLowerCase().includes('revenue') ||
            trigger.trigger_name.toLowerCase().includes('commission')
        );
        
        if (finalProblematicTriggers.length > 0) {
            console.log(`⚠️  Final problematic triggers found: ${finalProblematicTriggers.length}`);
            for (const trigger of finalProblematicTriggers) {
                try {
                    await client.query(`DROP TRIGGER IF EXISTS ${trigger.trigger_name} ON ${trigger.event_object_table} CASCADE;`);
                    console.log(`✅ Final cleanup: Dropped trigger ${trigger.trigger_name} on ${trigger.event_object_table}`);
                } catch (error) {
                    console.error(`❌ Final cleanup failed for ${trigger.trigger_name}:`, error.message);
                }
            }
        } else {
            console.log('✅ No problematic triggers remain after final cleanup');
        }
        
        console.log('\n🔍 Step 4: Final verification...');
        
        // Check if any triggers remain
        const remainingTriggers = await client.query(allTriggersQuery);
        console.log(`📊 Remaining triggers: ${remainingTriggers.rows.length}`);
        
        if (remainingTriggers.rows.length > 0) {
            console.log('📋 Remaining triggers:');
            remainingTriggers.rows.forEach(trigger => {
                console.log(`   - ${trigger.trigger_name} on ${trigger.event_object_table}`);
            });
        }
        
        // Check if any functions remain
        const remainingFunctions = await client.query(allFunctionsQuery);
        console.log(`📊 Remaining functions: ${remainingFunctions.rows.length}`);
        
        if (remainingFunctions.rows.length > 0) {
            console.log('📋 Remaining functions:');
            remainingFunctions.rows.forEach(func => {
                console.log(`   - ${func.routine_name} (${func.routine_type})`);
            });
        }
        
        console.log('\n🔍 Step 5: Checking for specific problematic function...');
        
        // Specifically look for the function mentioned in the error
        const specificFunctionQuery = `
            SELECT routine_name, routine_type
            FROM information_schema.routines 
            WHERE routine_schema = 'public'
            AND routine_name ILIKE '%handle_application_purchase%';
        `;
        
        const specificFunction = await client.query(specificFunctionQuery);
        
        if (specificFunction.rows.length > 0) {
            console.log('⚠️  Found handle_application_purchase function:');
            specificFunction.rows.forEach(func => {
                console.log(`   - ${func.routine_name} (${func.routine_type})`);
            });
            
            console.log('🔧 Attempting to remove it...');
            try {
                await client.query('DROP FUNCTION IF EXISTS handle_application_purchase();');
                console.log('✅ Dropped handle_application_purchase function');
            } catch (error) {
                console.error('❌ Failed to drop function:', error.message);
            }
        } else {
            console.log('✅ handle_application_purchase function not found');
        }
        
        client.release();
        
    } catch (error) {
        console.error('❌ Error during trigger removal:', error.message);
        
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

// Run the removal
removeAllTriggers().then(() => {
    console.log('\n🎉 Trigger removal script completed successfully!');
    process.exit(0);
}).catch((error) => {
    console.error('\n💥 Trigger removal script failed:', error);
    process.exit(1);
});
