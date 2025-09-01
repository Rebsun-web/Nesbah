require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addPosApplicationFields() {
    console.log('🔄 Adding required POS application fields to pos_application table...');
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        console.log('📋 Adding new POS application fields...');
        
        // Define the new POS application fields as per specification
        const newFields = [
            // POS Provider Name - Name of the POS system provider
            'pos_provider_name VARCHAR(255)',
            
            // POS Age Duration (months) - How long the business has been using POS
            'pos_age_duration_months INTEGER',
            
            // Average Monthly POS Sales (SAR) - Monthly sales volume through POS
            'avg_monthly_pos_sales DECIMAL(15,2)',
            
            // Requested Financing Amount (SAR) - Amount the business wants to finance
            'requested_financing_amount DECIMAL(15,2)',
            
            // Preferred Repayment Period (months) - Optional field for repayment preference
            'preferred_repayment_period_months INTEGER'
        ];

        // Add each field if it doesn't exist
        for (const field of newFields) {
            const [columnName, ...columnDef] = field.split(' ');
            try {
                await client.query(`ALTER TABLE pos_application ADD COLUMN IF NOT EXISTS ${columnName} ${columnDef.join(' ')}`);
                console.log(`✅ Field ready: ${columnName}`);
            } catch (error) {
                if (error.code === '42701') { // column already exists
                    console.log(`⚠️ Field already exists: ${columnName}`);
                } else {
                    console.error(`❌ Error adding field ${columnName}:`, error.message);
                    throw error;
                }
            }
        }

        // Create indexes for better performance on new fields
        console.log('📝 Creating indexes for new POS fields...');
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_pos_app_pos_provider_name ON pos_application(pos_provider_name)',
            'CREATE INDEX IF NOT EXISTS idx_pos_app_avg_monthly_sales ON pos_application(avg_monthly_pos_sales)',
            'CREATE INDEX IF NOT EXISTS idx_pos_app_financing_amount ON pos_application(requested_financing_amount)',
            'CREATE INDEX IF NOT EXISTS idx_pos_app_repayment_period ON pos_application(preferred_repayment_period_months)'
        ];

        for (const index of indexes) {
            try {
                await client.query(index);
                console.log(`✅ Index created/verified`);
            } catch (error) {
                console.log(`⚠️ Index creation warning:`, error.message);
            }
        }

        // Update existing records to set default values for new fields
        console.log('🔄 Updating existing records with default values...');
        
        const updateResult = await client.query(`
            UPDATE pos_application 
            SET 
                pos_provider_name = COALESCE(pos_provider_name, 'Not Specified'),
                pos_age_duration_months = COALESCE(pos_age_duration_months, 0),
                avg_monthly_pos_sales = COALESCE(avg_monthly_pos_sales, 0),
                requested_financing_amount = COALESCE(requested_financing_amount, 0),
                preferred_repayment_period_months = COALESCE(preferred_repayment_period_months, 12)
            WHERE 
                pos_provider_name IS NULL 
                OR pos_age_duration_months IS NULL 
                OR avg_monthly_pos_sales IS NULL 
                OR requested_financing_amount IS NULL 
                OR preferred_repayment_period_months IS NULL
        `);
        
        console.log(`✅ Updated ${updateResult.rowCount} existing records with default values`);

        await client.query('COMMIT');
        
        console.log('\n🎉 POS application fields added successfully!');
        
        // Display final table structure
        console.log('\n📋 Final pos_application table structure:');
        console.log('==================================================');
        
        const structureResult = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'pos_application' 
            ORDER BY ordinal_position
        `);
        
        structureResult.rows.forEach((column, index) => {
            console.log(`${index + 1}. ${column.column_name} (${column.data_type}) ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
            if (column.column_default) {
                console.log(`   Default: ${column.column_default}`);
            }
        });
        
        console.log(`\n📊 Total columns: ${structureResult.rows.length}`);
        
        // Show the new POS-specific fields
        console.log('\n🎯 New POS Application Fields Added:');
        console.log('=====================================');
        console.log('• pos_provider_name - POS Provider Name');
        console.log('• pos_age_duration_months - POS Age Duration (months)');
        console.log('• avg_monthly_pos_sales - Average Monthly POS Sales (SAR)');
        console.log('• requested_financing_amount - Requested Financing Amount (SAR)');
        console.log('• preferred_repayment_period_months - Preferred Repayment Period (months)');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Schema update failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration if this file is executed directly
if (require.main === module) {
    addPosApplicationFields()
        .then(() => {
            console.log('\n✅ Migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { addPosApplicationFields };
