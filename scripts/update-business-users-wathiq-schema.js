require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateBusinessUsersWathiqSchema() {
    console.log('🔄 Updating business_users table schema for comprehensive Wathiq API data...');
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        console.log('📋 Adding/updating Wathiq API fields to business_users table...');
        
        // Define all required Wathiq API fields with their data types
        const wathiqFields = [
            // Basic CR Information
            'cr_national_number VARCHAR(50) UNIQUE',
            'cr_number VARCHAR(50)',
            'trade_name VARCHAR(255)',
            'legal_form VARCHAR(255)',
            'registration_status VARCHAR(50)',
            
            // Address and Location
            'headquarter_city_name VARCHAR(255)',
            'headquarter_district_name VARCHAR(255)',
            'headquarter_street_name VARCHAR(255)',
            'headquarter_building_number VARCHAR(50)',
            'address TEXT',
            'city VARCHAR(255)',
            
            // Business Activities
            'sector TEXT',
            'activities TEXT[]',
            
            // Capital Information
            'cr_capital DECIMAL(20,2)',
            'cash_capital DECIMAL(20,2)',
            'in_kind_capital DECIMAL(20,2)',
            'avg_capital DECIMAL(20,2)',
            
            // Dates
            'issue_date_gregorian DATE',
            'confirmation_date_gregorian DATE',
            
            // E-commerce
            'has_ecommerce BOOLEAN DEFAULT false',
            'store_url VARCHAR(500)',
            
            // Management
            'management_structure VARCHAR(255)',
            'management_managers TEXT[]',
            
            // Contact Information (from Wathiq)
            'contact_info JSONB',
            
            // Verification
            'is_verified BOOLEAN DEFAULT false',
            'verification_date TIMESTAMP',
            'admin_notes TEXT',
            
            // Additional fields for compatibility
            'contact_person VARCHAR(255)',
            'contact_person_number VARCHAR(50)'
        ];

        // Add each field if it doesn't exist
        for (const field of wathiqFields) {
            const [columnName] = field.split(' ');
            try {
                await client.query(`ALTER TABLE business_users ADD COLUMN IF NOT EXISTS ${columnName}`);
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

        // Create indexes for better performance
        console.log('📝 Creating indexes for Wathiq fields...');
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_business_users_cr_national_number ON business_users(cr_national_number)',
            'CREATE INDEX IF NOT EXISTS idx_business_users_cr_number ON business_users(cr_number)',
            'CREATE INDEX IF NOT EXISTS idx_business_users_trade_name ON business_users(trade_name)',
            'CREATE INDEX IF NOT EXISTS idx_business_users_registration_status ON business_users(registration_status)',
            'CREATE INDEX IF NOT EXISTS idx_business_users_city ON business_users(city)',
            'CREATE INDEX IF NOT EXISTS idx_business_users_issue_date ON business_users(issue_date_gregorian)',
            'CREATE INDEX IF NOT EXISTS idx_business_users_has_ecommerce ON business_users(has_ecommerce)',
            'CREATE INDEX IF NOT EXISTS idx_business_users_activities ON business_users USING GIN(activities)',
            'CREATE INDEX IF NOT EXISTS idx_business_users_management_managers ON business_users USING GIN(management_managers)',
            'CREATE INDEX IF NOT EXISTS idx_business_users_contact_info ON business_users USING GIN(contact_info)'
        ];

        for (const index of indexes) {
            try {
                await client.query(index);
                console.log(`✅ Index created/verified`);
            } catch (error) {
                console.log(`⚠️ Index creation warning:`, error.message);
            }
        }

        // Update existing records to ensure data consistency
        console.log('🔄 Updating existing records for data consistency...');
        
        // Update records where cr_national_number is null but cr_number exists
        const updateResult = await client.query(`
            UPDATE business_users 
            SET cr_national_number = cr_number 
            WHERE cr_national_number IS NULL AND cr_number IS NOT NULL
        `);
        console.log(`✅ Updated ${updateResult.rowCount} records for cr_national_number consistency`);

        // Update records where city is null but headquarter_city_name exists
        const cityUpdateResult = await client.query(`
            UPDATE business_users 
            SET city = COALESCE(city, headquarter_city_name)
            WHERE city IS NULL AND headquarter_city_name IS NOT NULL
        `);
        console.log(`✅ Updated ${cityUpdateResult.rowCount} records for city consistency`);

        // Update records where legal_form is null but form_name exists (for backward compatibility)
        const legalFormUpdateResult = await client.query(`
            UPDATE business_users 
            SET legal_form = COALESCE(legal_form, form_name)
            WHERE legal_form IS NULL AND form_name IS NOT NULL
        `);
        console.log(`✅ Updated ${legalFormUpdateResult.rowCount} records for legal_form consistency`);

        await client.query('COMMIT');
        
        console.log('\n🎉 Business users Wathiq schema update completed successfully!');
        
        // Display final table structure
        console.log('\n📋 Final business_users table structure:');
        console.log('==================================================');
        
        const structureResult = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'business_users' 
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
    updateBusinessUsersWathiqSchema()
        .then(() => {
            console.log('\n✅ Migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { updateBusinessUsersWathiqSchema };
