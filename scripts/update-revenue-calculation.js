const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function updateRevenueCalculation() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Updating revenue calculation system...');
        
        // 1. Add has_been_purchased column if it doesn't exist
        await client.query(`
            ALTER TABLE submitted_applications 
            ADD COLUMN IF NOT EXISTS has_been_purchased BOOLEAN DEFAULT FALSE
        `);
        console.log('✅ Added has_been_purchased column');
        
        // 2. Update has_been_purchased flag for existing applications
        await client.query(`
            UPDATE submitted_applications 
            SET has_been_purchased = TRUE 
            WHERE application_id IN (
                SELECT DISTINCT application_id 
                FROM application_offer_tracking 
                WHERE current_application_status = 'purchased'
            )
        `);
        console.log('✅ Updated has_been_purchased flag for existing applications');
        
        // 3. Create function to update has_been_purchased flag
        await client.query(`
            CREATE OR REPLACE FUNCTION update_has_been_purchased()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Update submitted_applications.has_been_purchased when status becomes purchased
                IF NEW.current_application_status = 'purchased' THEN
                    UPDATE submitted_applications 
                    SET has_been_purchased = TRUE 
                    WHERE application_id = NEW.application_id;
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        console.log('✅ Created update_has_been_purchased function');
        
        // 4. Create trigger to automatically update has_been_purchased
        await client.query(`
            DROP TRIGGER IF EXISTS trigger_update_has_been_purchased ON application_offer_tracking;
            
            CREATE TRIGGER trigger_update_has_been_purchased
            AFTER UPDATE OF current_application_status ON application_offer_tracking
            FOR EACH ROW
            EXECUTE FUNCTION update_has_been_purchased();
        `);
        console.log('✅ Created trigger for automatic has_been_purchased updates');
        
        // 5. Test the revenue calculation
        const revenueResult = await client.query(`
            SELECT 
                COUNT(*) as purchased_applications,
                COUNT(*) * 25 as total_revenue
            FROM submitted_applications 
            WHERE has_been_purchased = TRUE
        `);
        
        console.log('📊 Revenue calculation test:');
        console.log(`   Purchased applications: ${revenueResult.rows[0].purchased_applications}`);
        console.log(`   Total revenue: SAR ${revenueResult.rows[0].total_revenue}`);
        
        // 6. Show current status
        const statusResult = await client.query(`
            SELECT 
                sa.application_id,
                sa.status,
                sa.has_been_purchased,
                COALESCE(aot.current_application_status, sa.status) as tracking_status
            FROM submitted_applications sa
            LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
            WHERE aot.id IS NOT NULL
            ORDER BY sa.application_id
        `);
        
        console.log('\n📋 Current application status:');
        statusResult.rows.forEach(row => {
            console.log(`   App ${row.application_id}: ${row.status} -> ${row.tracking_status} (purchased: ${row.has_been_purchased})`);
        });
        
        console.log('\n✅ Revenue calculation system updated successfully!');
        
    } catch (error) {
        console.error('❌ Error updating revenue calculation:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the update
updateRevenueCalculation()
    .then(() => {
        console.log('🎉 Revenue calculation update completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Revenue calculation update failed:', error);
        process.exit(1);
    });
