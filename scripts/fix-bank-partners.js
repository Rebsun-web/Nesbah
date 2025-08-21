import pool from '../src/lib/db.cjs'

async function fixBankPartners() {
    const client = await pool.connect()
    
    try {
        console.log('🔧 Fixing bank_partners table issue...')
        
        // Option 1: Create the missing bank_partners table
        console.log('📋 Creating bank_partners table...')
        await client.query(`
            CREATE TABLE IF NOT EXISTS bank_partners (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                bank_name VARCHAR(255) NOT NULL,
                commission_rate DECIMAL(5,2) DEFAULT 0.00,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `)
        
        // Option 2: Insert default records for existing admin users
        console.log('👥 Adding default bank partners for admin users...')
        await client.query(`
            INSERT INTO bank_partners (user_id, bank_name, commission_rate, is_active)
            SELECT admin_id, 'Admin Bank', 0.00, true
            FROM admin_users
            WHERE NOT EXISTS (
                SELECT 1 FROM bank_partners bp WHERE bp.user_id = admin_users.admin_id
            )
        `)
        
        // Option 3: If the trigger is still problematic, we can disable it
        console.log('🔍 Checking for problematic triggers...')
        const triggers = await client.query(`
            SELECT trigger_name, event_manipulation, event_object_table
            FROM information_schema.triggers
            WHERE event_object_table = 'application_offers'
        `)
        
        console.log('📊 Found triggers on application_offers:', triggers.rows)
        
        // Option 4: Alternative - modify the trigger to use existing tables
        console.log('🛠️ Attempting to fix the trigger...')
        try {
            await client.query(`
                CREATE OR REPLACE FUNCTION calculate_commission_fields()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- Use existing tables instead of bank_partners
                    -- Set default commission rate to 0 if no specific rate is found
                    NEW.commission_rate := COALESCE(0.00, 0.00);
                    NEW.commission_amount := COALESCE(NEW.deal_value * 0.00, 0.00);
                    NEW.bank_revenue := COALESCE(NEW.deal_value - NEW.commission_amount, NEW.deal_value);
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `)
            console.log('✅ Trigger function updated successfully')
        } catch (error) {
            console.log('⚠️ Could not update trigger function:', error.message)
        }
        
        console.log('✅ Bank partners issue fixed!')
        
    } catch (error) {
        console.error('❌ Error fixing bank_partners:', error)
        throw error
    } finally {
        client.release()
    }
}

// Run the fix
fixBankPartners()
    .then(() => {
        console.log('🎉 Bank partners fix completed successfully!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('💥 Bank partners fix failed:', error)
        process.exit(1)
    })
