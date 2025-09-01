require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createBankEmployeesTable() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Creating bank_employees table and updating schema...');
        
        // 1. Create bank_employees table first
        console.log('📋 Creating bank_employees table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS bank_employees (
                employee_id SERIAL PRIMARY KEY,
                bank_user_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                first_name VARCHAR(255) NOT NULL,
                last_name VARCHAR(255) NOT NULL,
                position VARCHAR(255),
                phone VARCHAR(20),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                last_login_at TIMESTAMP NULL
            )
        `);

        // 2. Create indexes for better performance
        console.log('📝 Creating indexes...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_bank_employees_bank_user_id ON bank_employees(bank_user_id);
            CREATE INDEX IF NOT EXISTS idx_bank_employees_user_id ON bank_employees(user_id);
            CREATE INDEX IF NOT EXISTS idx_bank_employees_is_active ON bank_employees(is_active);
            CREATE INDEX IF NOT EXISTS idx_bank_employees_last_login ON bank_employees(last_login_at);
        `);

        // 3. Add foreign key constraints after table creation
        console.log('🔗 Adding foreign key constraints...');
        try {
            await client.query(`
                ALTER TABLE bank_employees 
                ADD CONSTRAINT fk_bank_employees_bank_user 
                FOREIGN KEY (bank_user_id) REFERENCES bank_users(user_id) ON DELETE CASCADE
            `);
            console.log('✅ Added foreign key constraint to bank_users');
        } catch (error) {
            if (error.code === '42710') { // constraint already exists
                console.log('⚠️ Foreign key constraint to bank_users already exists');
            } else {
                console.log('⚠️ Could not add foreign key constraint to bank_users:', error.message);
            }
        }

        try {
            await client.query(`
                ALTER TABLE bank_employees 
                ADD CONSTRAINT fk_bank_employees_user 
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            `);
            console.log('✅ Added foreign key constraint to users');
        } catch (error) {
            if (error.code === '42710') { // constraint already exists
                console.log('⚠️ Foreign key constraint to users already exists');
            } else {
                console.log('⚠️ Could not add foreign key constraint to users:', error.message);
            }
        }

        try {
            await client.query(`
                ALTER TABLE bank_employees 
                ADD CONSTRAINT uk_bank_employees_user_id 
                UNIQUE (user_id)
            `);
            console.log('✅ Added unique constraint on user_id');
        } catch (error) {
            if (error.code === '42710') { // constraint already exists
                console.log('⚠️ Unique constraint on user_id already exists');
            } else {
                console.log('⚠️ Could not add unique constraint on user_id:', error.message);
            }
        }

        // 4. Add employee_id column to tracking tables for audit purposes
        console.log('📝 Adding employee_id to tracking tables...');
        
        // Add to bank_application_views if it exists
        try {
            await client.query(`
                ALTER TABLE bank_application_views 
                ADD COLUMN IF NOT EXISTS employee_id INTEGER
            `);
            console.log('✅ Added employee_id to bank_application_views');
        } catch (error) {
            if (error.code === '42P01') { // table doesn't exist
                console.log('⚠️ bank_application_views table doesn\'t exist, skipping...');
            } else {
                console.log('⚠️ Could not add employee_id to bank_application_views:', error.message);
            }
        }

        // Add to bank_offer_submissions if it exists
        try {
            await client.query(`
                ALTER TABLE bank_offer_submissions 
                ADD COLUMN IF NOT EXISTS employee_id INTEGER
            `);
            console.log('✅ Added employee_id to bank_offer_submissions');
        } catch (error) {
            if (error.code === '42P01') { // table doesn't exist
                console.log('⚠️ bank_offer_submissions table doesn\'t exist, skipping...');
            } else {
                console.log('⚠️ Could not add employee_id to bank_offer_submissions:', error.message);
            }
        }

        // Add to application_offers if it exists
        try {
            await client.query(`
                ALTER TABLE application_offers 
                ADD COLUMN IF NOT EXISTS employee_id INTEGER
            `);
            console.log('✅ Added employee_id to application_offers');
        } catch (error) {
            if (error.code === '42P01') { // table doesn't exist
                console.log('⚠️ application_offers table doesn\'t exist, skipping...');
            } else {
                console.log('⚠️ Could not add employee_id to application_offers:', error.message);
            }
        }

        // Add to revenue_collections if it exists
        try {
            await client.query(`
                ALTER TABLE revenue_collections 
                ADD COLUMN IF NOT EXISTS employee_id INTEGER
            `);
            console.log('✅ Added employee_id to revenue_collections');
        } catch (error) {
            if (error.code === '42P01') { // table doesn't exist
                console.log('⚠️ revenue_collections table doesn\'t exist, skipping...');
            } else {
                console.log('⚠️ Could not add employee_id to revenue_collections:', error.message);
            }
        }

        // 5. Create audit log table for employee actions
        console.log('📋 Creating bank_employee_audit_log table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS bank_employee_audit_log (
                log_id SERIAL PRIMARY KEY,
                employee_id INTEGER NOT NULL,
                bank_user_id INTEGER NOT NULL,
                action_type VARCHAR(100) NOT NULL,
                action_details TEXT,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create index for audit log
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_audit_log_employee_id ON bank_employee_audit_log(employee_id);
            CREATE INDEX IF NOT EXISTS idx_audit_log_bank_user_id ON bank_employee_audit_log(bank_user_id);
            CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON bank_employee_audit_log(created_at);
        `);

        // 6. Add foreign key constraints to audit log table
        console.log('🔗 Adding foreign key constraints to audit log...');
        try {
            await client.query(`
                ALTER TABLE bank_employee_audit_log 
                ADD CONSTRAINT fk_audit_log_employee 
                FOREIGN KEY (employee_id) REFERENCES bank_employees(employee_id) ON DELETE CASCADE
            `);
            console.log('✅ Added foreign key constraint to audit log employee');
        } catch (error) {
            if (error.code === '42710') { // constraint already exists
                console.log('⚠️ Foreign key constraint to audit log employee already exists');
            } else {
                console.log('⚠️ Could not add foreign key constraint to audit log employee:', error.message);
            }
        }

        try {
            await client.query(`
                ALTER TABLE bank_employee_audit_log 
                ADD CONSTRAINT fk_audit_log_bank 
                FOREIGN KEY (bank_user_id) REFERENCES bank_users(user_id) ON DELETE CASCADE
            `);
            console.log('✅ Added foreign key constraint to audit log bank');
        } catch (error) {
            if (error.code === '42710') { // constraint already exists
                console.log('⚠️ Foreign key constraint to audit log bank already exists');
            } else {
                console.log('⚠️ Could not add foreign key constraint to audit log bank:', error.message);
            }
        }
        
        console.log('✅ bank_employees table and schema updates completed successfully');
        
        // 7. Display table structure
        console.log('\n📊 bank_employees table structure:');
        const columns = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'bank_employees' 
            ORDER BY ordinal_position
        `);
        
        columns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

        // 8. Display audit log table structure
        console.log('\n📊 bank_employee_audit_log table structure:');
        const auditColumns = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'bank_employee_audit_log' 
            ORDER BY ordinal_position
        `);
        
        auditColumns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

    } catch (error) {
        console.error('❌ Error creating bank_employees table:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

createBankEmployeesTable()
    .then(() => {
        console.log('\n🎉 Bank employees table creation completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Bank employees table creation failed:', error);
        process.exit(1);
    });
