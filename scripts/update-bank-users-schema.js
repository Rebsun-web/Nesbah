require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

async function updateBankUsersSchema() {
    console.log('🔄 Updating bank_users table schema for SAMA integration and logo support...');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        console.log('📋 Adding new columns to bank_users table...');
        
        // Add new columns for SAMA integration and logo support
        const newColumns = [
            'sama_license_number VARCHAR(50) UNIQUE',
            'bank_type VARCHAR(100)',
            'license_status VARCHAR(50)',
            'establishment_date DATE',
            'authorized_capital DECIMAL(20,2)',
            'head_office_address TEXT',
            'sama_compliance_status VARCHAR(50)',
            'number_of_branches INTEGER',
            'logo_url VARCHAR(500)'
        ];

        for (const column of newColumns) {
            const [columnName] = column.split(' ');
            try {
                await client.query(`ALTER TABLE bank_users ADD COLUMN ${column}`);
                console.log(`✅ Added column: ${columnName}`);
            } catch (error) {
                if (error.code === '42701') { // column already exists
                    console.log(`⚠️ Column ${columnName} already exists, skipping...`);
                } else {
                    throw error;
                }
            }
        }

        // Update existing bank users with mock SAMA data
        console.log('📋 Updating existing bank users with SAMA data...');
        
        const mockSamaData = {
            'partnerships@snb.sa': {
                sama_license_number: '1000',
                bank_type: 'Commercial Bank',
                license_status: 'Active',
                establishment_date: '1953-06-26',
                authorized_capital: 50000000000,
                head_office_address: 'King Fahd Road, Riyadh',
                sama_compliance_status: 'Compliant',
                number_of_branches: 400,
                logo_url: null
            },
            'business@riyad-bank.sa': {
                sama_license_number: '1001',
                bank_type: 'Commercial Bank',
                license_status: 'Active',
                establishment_date: '1957-04-23',
                authorized_capital: 30000000000,
                head_office_address: 'King Fahd Road, Riyadh',
                sama_compliance_status: 'Compliant',
                number_of_branches: 350,
                logo_url: null
            },
            'corporate@anb.sa': {
                sama_license_number: '1002',
                bank_type: 'Commercial Bank',
                license_status: 'Active',
                establishment_date: '1979-12-21',
                authorized_capital: 15000000000,
                head_office_address: 'King Fahd Road, Riyadh',
                sama_compliance_status: 'Compliant',
                number_of_branches: 200,
                logo_url: null
            }
        };

        for (const [email, data] of Object.entries(mockSamaData)) {
            try {
                await client.query(`
                    UPDATE bank_users 
                    SET 
                        sama_license_number = $1,
                        bank_type = $2,
                        license_status = $3,
                        establishment_date = $4,
                        authorized_capital = $5,
                        head_office_address = $6,
                        sama_compliance_status = $7,
                        number_of_branches = $8,
                        logo_url = $9
                    WHERE email = $10
                `, [
                    data.sama_license_number,
                    data.bank_type,
                    data.license_status,
                    data.establishment_date,
                    data.authorized_capital,
                    data.head_office_address,
                    data.sama_compliance_status,
                    data.number_of_branches,
                    data.logo_url,
                    email
                ]);
                console.log(`✅ Updated bank user: ${email}`);
            } catch (error) {
                console.log(`⚠️ Could not update bank user ${email}:`, error.message);
            }
        }

        // Add indexes for better performance
        console.log('📋 Adding indexes...');
        
        try {
            await client.query('CREATE INDEX IF NOT EXISTS idx_bank_users_sama_license ON bank_users(sama_license_number)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_bank_users_bank_type ON bank_users(bank_type)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_bank_users_license_status ON bank_users(license_status)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_bank_users_logo_url ON bank_users(logo_url)');
            console.log('✅ Added indexes');
        } catch (error) {
            console.log('⚠️ Index creation error:', error.message);
        }

        await client.query('COMMIT');
        console.log('✅ Bank users schema update completed successfully');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Bank users schema update failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    updateBankUsersSchema()
        .then(() => {
            console.log('Bank users schema update completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Bank users schema update failed:', error);
            process.exit(1);
        });
}

module.exports = { updateBankUsersSchema };
