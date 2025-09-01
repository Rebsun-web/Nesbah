const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Riyadh123%21%40%23@34.166.77.134:5432/postgres',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateApplication7MissingData() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Updating Application ID 7 with missing data...\n');
        
        // First, let's check what needs to be updated
        const currentQuery = `
            SELECT 
                pos_provider_name,
                pos_age_duration_months,
                avg_monthly_pos_sales,
                requested_financing_amount,
                preferred_repayment_period_months,
                city_of_operation,
                notes
            FROM pos_application 
            WHERE application_id = 7
        `;
        
        const current = await client.query(currentQuery);
        
        if (current.rows.length === 0) {
            console.log('❌ Application 7 not found');
            return;
        }
        
        const currentData = current.rows[0];
        console.log('📋 Current Data:');
        console.log(`  POS Provider: ${currentData.pos_provider_name || 'NULL'}`);
        console.log(`  POS Age: ${currentData.pos_age_duration_months || 'NULL'}`);
        console.log(`  Monthly Sales: ${currentData.avg_monthly_pos_sales || 'NULL'}`);
        console.log(`  Financing Amount: ${currentData.requested_financing_amount || 'NULL'}`);
        console.log(`  Repayment Period: ${currentData.preferred_repayment_period_months || 'NULL'}`);
        console.log(`  City of Operation: ${currentData.city_of_operation || 'NULL'}`);
        console.log(`  Notes: ${currentData.notes || 'NULL'}`);
        
        // Check if we need to update anything
        const needsUpdate = !currentData.pos_provider_name || 
                           !currentData.pos_age_duration_months || 
                           !currentData.avg_monthly_pos_sales || 
                           !currentData.requested_financing_amount || 
                           !currentData.preferred_repayment_period_months || 
                           !currentData.city_of_operation || 
                           !currentData.notes;
        
        if (!needsUpdate) {
            console.log('\n✅ All data is already present!');
            return;
        }
        
        console.log('\n🔧 Updating missing data...');
        
        await client.query('BEGIN');
        
        try {
            // Update with the correct data we found
            const updateQuery = `
                UPDATE pos_application 
                SET 
                    pos_provider_name = COALESCE(pos_provider_name, 'Verifone'),
                    pos_age_duration_months = COALESCE(pos_age_duration_months, 24),
                    avg_monthly_pos_sales = COALESCE(avg_monthly_pos_sales, 500000.00),
                    requested_financing_amount = COALESCE(requested_financing_amount, 1000000.00),
                    preferred_repayment_period_months = COALESCE(preferred_repayment_period_months, 24),
                    city_of_operation = COALESCE(city_of_operation, 'Dubai'),
                    notes = COALESCE(notes, 'Hello')
                WHERE application_id = 7
                RETURNING 
                    pos_provider_name,
                    pos_age_duration_months,
                    avg_monthly_pos_sales,
                    requested_financing_amount,
                    preferred_repayment_period_months,
                    city_of_operation,
                    notes
            `;
            
            const updateResult = await client.query(updateQuery);
            
            if (updateResult.rows.length > 0) {
                const updated = updateResult.rows[0];
                console.log('\n✅ Update successful!');
                console.log(`  POS Provider: ${updated.pos_provider_name}`);
                console.log(`  POS Age: ${updated.pos_age_duration_months} months`);
                console.log(`  Monthly Sales: SAR ${updated.avg_monthly_pos_sales}`);
                console.log(`  Financing Amount: SAR ${updated.requested_financing_amount}`);
                console.log(`  Repayment Period: ${updated.preferred_repayment_period_months} months`);
                console.log(`  City of Operation: ${updated.city_of_operation}`);
                console.log(`  Notes: ${updated.notes}`);
            }
            
            await client.query('COMMIT');
            console.log('\n✅ Transaction committed successfully');
            
        } catch (updateError) {
            await client.query('ROLLBACK');
            console.error('❌ Update failed, rolling back:', updateError);
            throw updateError;
        }
        
    } catch (error) {
        console.error('❌ Error updating application:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

updateApplication7MissingData().catch(console.error);
