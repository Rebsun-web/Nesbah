const pool = require('../src/lib/db.cjs');

async function implementRevenueRule() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Implementing revenue rule for purchased applications...');
        
        // Step 1: Update all existing applications that have been purchased but don't have revenue
        console.log('📊 Updating existing purchased applications...');
        
        const updateExistingPurchased = await client.query(`
            UPDATE submitted_applications 
            SET revenue_collected = 25.00
            WHERE status = 'completed' 
            AND (revenue_collected IS NULL OR revenue_collected = 0)
            AND id IN (
                SELECT DISTINCT application_id 
                FROM application_revenue 
                WHERE transaction_type = 'lead_purchase'
            )
        `);
        
        console.log(`✅ Updated ${updateExistingPurchased.rowCount} existing purchased applications with 25 SAR revenue`);
        
        // Step 2: Update applications that have purchased_by array but no revenue
        const updatePurchasedByArray = await client.query(`
            UPDATE submitted_applications 
            SET revenue_collected = 25.00
            WHERE array_length(purchased_by, 1) > 0
            AND (revenue_collected IS NULL OR revenue_collected = 0)
        `);
        
        console.log(`✅ Updated ${updatePurchasedByArray.rowCount} applications with purchased_by array with 25 SAR revenue`);
        
        // Step 3: Create database trigger for future applications
        console.log('🔧 Creating database trigger for future applications...');
        
        // Create trigger function
        await client.query(`
            CREATE OR REPLACE FUNCTION ensure_revenue_on_purchase()
            RETURNS TRIGGER AS $$
            BEGIN
                -- If application is purchased (has purchased_by array or status is completed)
                -- and doesn't have revenue, add 25 SAR
                IF (array_length(NEW.purchased_by, 1) > 0 OR NEW.status = 'completed') 
                   AND (NEW.revenue_collected IS NULL OR NEW.revenue_collected = 0) THEN
                    NEW.revenue_collected := 25.00;
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        // Create trigger
        await client.query(`
            DROP TRIGGER IF EXISTS trigger_ensure_revenue_on_purchase ON submitted_applications;
            CREATE TRIGGER trigger_ensure_revenue_on_purchase
                BEFORE INSERT OR UPDATE ON submitted_applications
                FOR EACH ROW
                EXECUTE FUNCTION ensure_revenue_on_purchase();
        `);
        
        console.log('✅ Created database trigger for automatic revenue tracking');
        
        // Step 4: Create trigger for application_revenue table to sync revenue
        await client.query(`
            CREATE OR REPLACE FUNCTION sync_revenue_on_purchase()
            RETURNS TRIGGER AS $$
            BEGIN
                -- When a new revenue record is created, ensure the application has 25 SAR revenue
                UPDATE submitted_applications 
                SET revenue_collected = 25.00
                WHERE id = NEW.application_id 
                AND (revenue_collected IS NULL OR revenue_collected = 0);
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        await client.query(`
            DROP TRIGGER IF EXISTS trigger_sync_revenue_on_purchase ON application_revenue;
            CREATE TRIGGER trigger_sync_revenue_on_purchase
                AFTER INSERT ON application_revenue
                FOR EACH ROW
                EXECUTE FUNCTION sync_revenue_on_purchase();
        `);
        
        console.log('✅ Created trigger to sync revenue when applications are purchased');
        
        // Step 5: Show summary of current revenue data
        const summary = await client.query(`
            SELECT 
                COUNT(*) as total_applications,
                SUM(revenue_collected) as total_revenue,
                COUNT(CASE WHEN revenue_collected > 0 THEN 1 END) as revenue_generating_apps,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_apps,
                COUNT(CASE WHEN array_length(purchased_by, 1) > 0 THEN 1 END) as purchased_apps
            FROM submitted_applications
        `);
        
        const data = summary.rows[0];
        console.log('\n📊 Revenue Data Summary After Rule Implementation:');
        console.log(`Total Applications: ${data.total_applications}`);
        console.log(`Total Revenue: SAR ${parseFloat(data.total_revenue || 0).toFixed(2)}`);
        console.log(`Revenue Generating Apps: ${data.revenue_generating_apps}`);
        console.log(`Completed Applications: ${data.completed_apps}`);
        console.log(`Purchased Applications: ${data.purchased_apps}`);
        
        // Step 6: Show applications that should have revenue but don't
        const missingRevenue = await client.query(`
            SELECT 
                id,
                application_id,
                status,
                revenue_collected,
                array_length(purchased_by, 1) as purchased_count
            FROM submitted_applications 
            WHERE (status = 'completed' OR array_length(purchased_by, 1) > 0)
            AND (revenue_collected IS NULL OR revenue_collected = 0)
        `);
        
        if (missingRevenue.rows.length > 0) {
            console.log('\n⚠️ Applications that should have revenue but don\'t:');
            missingRevenue.rows.forEach(row => {
                console.log(`- App ID: ${row.application_id}, Status: ${row.status}, Purchased: ${row.purchased_count}`);
            });
        } else {
            console.log('\n✅ All purchased applications now have proper revenue tracking!');
        }
        
        console.log('\n🎉 Revenue rule implementation completed!');
        console.log('📋 Rules implemented:');
        console.log('   • All purchased applications automatically get 25 SAR revenue');
        console.log('   • Database triggers ensure future applications follow this rule');
        console.log('   • Revenue is synced when applications are purchased');
        
    } catch (error) {
        console.error('❌ Error implementing revenue rule:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the script
if (require.main === module) {
    implementRevenueRule()
        .then(() => {
            console.log('🎉 Revenue rule implementation completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Script failed:', error);
            process.exit(1);
        });
}

module.exports = { implementRevenueRule };
