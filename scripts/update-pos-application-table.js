require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updatePosApplicationTable() {
    const client = await pool.connect();
    
    try {
        console.log('🔗 Connecting to database...');
        
        // Add missing columns to pos_application table if they don't exist
        console.log('📋 Updating pos_application table...');
        
        await client.query(`
            ALTER TABLE pos_application 
            ADD COLUMN IF NOT EXISTS purchased_by INTEGER[] DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS revenue_collected DECIMAL(10,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS offers_count INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS current_application_status VARCHAR(50) DEFAULT 'live_auction',
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS auction_end_time TIMESTAMP,
            ADD COLUMN IF NOT EXISTS monthly_sales DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS financing_amount DECIMAL(15,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS repayment_period INTEGER DEFAULT 12,
            ADD COLUMN IF NOT EXISTS pos_provider VARCHAR(255),
            ADD COLUMN IF NOT EXISTS pos_age VARCHAR(100)
        `);

        console.log('✅ pos_application table updated successfully');
        
        // Create indexes for better performance
        console.log('📝 Creating indexes...');
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_pos_app_current_status ON pos_application(current_application_status)',
            'CREATE INDEX IF NOT EXISTS idx_pos_app_offers_count ON pos_application(offers_count)',
            'CREATE INDEX IF NOT EXISTS idx_pos_app_auction_end ON pos_application(auction_end_time)',
            'CREATE INDEX IF NOT EXISTS idx_pos_app_updated_at ON pos_application(updated_at)'
        ];

        for (const index of indexes) {
            try {
                await client.query(index);
                console.log(`✅ Index created/verified`);
            } catch (error) {
                console.log(`⚠️ Index creation warning:`, error.message);
            }
        }
        
        // Update existing records to set default values
        console.log('🔄 Updating existing records...');
        const updateResult = await client.query(`
            UPDATE pos_application 
            SET 
                current_application_status = COALESCE(current_application_status, status),
                updated_at = COALESCE(updated_at, submitted_at)
            WHERE current_application_status IS NULL OR updated_at IS NULL
        `);
        
        console.log(`✅ Updated ${updateResult.rowCount} existing records`);
        
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
        
    } catch (error) {
        console.error('❌ Error updating pos_application table:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

updatePosApplicationTable().catch(console.error);
