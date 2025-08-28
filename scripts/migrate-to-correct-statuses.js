const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateToCorrectStatuses() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Starting status migration to correct statuses...');
        
        // Check current status distribution
        console.log('\n📊 Current status distribution:');
        const currentStatuses = await client.query(`
            SELECT 
                COALESCE(aot.current_application_status, sa.status) as status,
                COUNT(DISTINCT sa.application_id) as count
            FROM submitted_applications sa
            LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
            GROUP BY COALESCE(aot.current_application_status, sa.status)
            ORDER BY COALESCE(aot.current_application_status, sa.status)
        `);
        
        currentStatuses.rows.forEach(row => {
            console.log(`  ${row.status}: ${row.count}`);
        });
        
        // Migration mapping
        const statusMapping = {
            'approved_leads': 'live_auction',
            'complete': 'completed',
            'ignored': 'ignored'
        };
        
        console.log('\n🔄 Migrating statuses...');
        
        // Update submitted_applications table
        for (const [oldStatus, newStatus] of Object.entries(statusMapping)) {
            if (oldStatus !== newStatus) {
                const result = await client.query(`
                    UPDATE submitted_applications 
                    SET status = $1 
                    WHERE status = $2
                `, [newStatus, oldStatus]);
                console.log(`  submitted_applications: ${oldStatus} → ${newStatus} (${result.rowCount} rows)`);
            }
        }
        
        // Update pos_application table
        for (const [oldStatus, newStatus] of Object.entries(statusMapping)) {
            if (oldStatus !== newStatus) {
                const result = await client.query(`
                    UPDATE pos_application 
                    SET status = $1 
                    WHERE status = $2
                `, [newStatus, oldStatus]);
                console.log(`  pos_application: ${oldStatus} → ${newStatus} (${result.rowCount} rows)`);
            }
        }
        
        // Update application_offer_tracking table
        for (const [oldStatus, newStatus] of Object.entries(statusMapping)) {
            if (oldStatus !== newStatus) {
                const result = await client.query(`
                    UPDATE application_offer_tracking 
                    SET current_application_status = $1 
                    WHERE current_application_status = $2
                `, [newStatus, oldStatus]);
                console.log(`  application_offer_tracking: ${oldStatus} → ${newStatus} (${result.rowCount} rows)`);
            }
        }
        
        // Drop existing constraints
        console.log('\n📋 Dropping existing status constraints...');
        try {
            await client.query('ALTER TABLE submitted_applications DROP CONSTRAINT IF EXISTS submitted_applications_status_check');
            console.log('  ✅ Dropped submitted_applications_status_check');
        } catch (err) {
            console.log('  ⚠️  submitted_applications_status_check may not exist');
        }
        
        try {
            await client.query('ALTER TABLE pos_application DROP CONSTRAINT IF EXISTS pos_application_status_check');
            console.log('  ✅ Dropped pos_application_status_check');
        } catch (err) {
            console.log('  ⚠️  pos_application_status_check may not exist');
        }
        
        // Add new constraints for the three correct statuses
        console.log('\n📋 Adding new status constraints...');
        
        await client.query(`
            ALTER TABLE submitted_applications 
            ADD CONSTRAINT submitted_applications_status_check 
            CHECK (status IN ('live_auction', 'completed', 'ignored'))
        `);
        console.log('  ✅ Added submitted_applications_status_check');
        
        await client.query(`
            ALTER TABLE pos_application 
            ADD CONSTRAINT pos_application_status_check 
            CHECK (status IN ('live_auction', 'completed', 'ignored'))
        `);
        console.log('  ✅ Added pos_application_status_check');
        
        // Check final status distribution
        console.log('\n📊 Final status distribution:');
        const finalStatuses = await client.query(`
            SELECT 
                COALESCE(aot.current_application_status, sa.status) as status,
                COUNT(DISTINCT sa.application_id) as count
            FROM submitted_applications sa
            LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
            GROUP BY COALESCE(aot.current_application_status, sa.status)
            ORDER BY COALESCE(aot.current_application_status, sa.status)
        `);
        
        finalStatuses.rows.forEach(row => {
            console.log(`  ${row.status}: ${row.count}`);
        });
        
        console.log('\n✅ Status migration completed successfully!');
        console.log('🎯 Now using only the three correct statuses: live_auction, completed, ignored');
        
    } catch (error) {
        console.error('❌ Error during status migration:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

migrateToCorrectStatuses();
