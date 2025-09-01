require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addBankOfferFields() {
    console.log('🔄 Adding required bank offer fields to application_offers table...');
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        console.log('📋 Adding new bank offer fields...');
        
        // Define the new bank offer fields as per specification
        const newFields = [
            // Bank Offer Requirements (5.1)
            'approved_financing_amount DECIMAL(15,2)',
            'proposed_repayment_period_months INTEGER',
            'interest_rate DECIMAL(5,2)',
            'monthly_installment_amount DECIMAL(15,2)',
            'grace_period_months INTEGER',
            'relationship_manager_name VARCHAR(255)',
            'relationship_manager_phone VARCHAR(50)',
            'relationship_manager_email VARCHAR(255)',
            
            // Enhanced file upload support
            'offer_document BYTEA',
            'offer_document_mimetype VARCHAR(100)',
            'offer_document_filename VARCHAR(255)',
            'offer_document_size INTEGER',
            
            // Additional offer details
            'offer_summary TEXT',
            'special_conditions TEXT',
            'early_payment_discount DECIMAL(5,2)',
            'late_payment_penalty DECIMAL(5,2)',
            'collateral_requirements TEXT',
            'processing_fee DECIMAL(10,2)',
            'insurance_requirements TEXT'
        ];

        // Add each field if it doesn't exist
        for (const field of newFields) {
            const [columnName, ...columnDef] = field.split(' ');
            try {
                await client.query(`ALTER TABLE application_offers ADD COLUMN IF NOT EXISTS ${columnName} ${columnDef.join(' ')}`);
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
        console.log('📝 Creating indexes for new bank offer fields...');
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_offers_financing_amount ON application_offers(approved_financing_amount)',
            'CREATE INDEX IF NOT EXISTS idx_offers_repayment_period ON application_offers(proposed_repayment_period_months)',
            'CREATE INDEX IF NOT EXISTS idx_offers_interest_rate ON application_offers(interest_rate)',
            'CREATE INDEX IF NOT EXISTS idx_offers_monthly_installment ON application_offers(monthly_installment_amount)',
            'CREATE INDEX IF NOT EXISTS idx_offers_grace_period ON application_offers(grace_period_months)',
            'CREATE INDEX IF NOT EXISTS idx_offers_relationship_manager ON application_offers(relationship_manager_name)',
            'CREATE INDEX IF NOT EXISTS idx_offers_processing_fee ON application_offers(processing_fee)'
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
            UPDATE application_offers 
            SET 
                approved_financing_amount = COALESCE(approved_financing_amount, deal_value),
                proposed_repayment_period_months = COALESCE(proposed_repayment_period_months, 12),
                interest_rate = COALESCE(interest_rate, 0),
                monthly_installment_amount = COALESCE(monthly_installment_amount, 0),
                grace_period_months = COALESCE(grace_period_months, 0),
                relationship_manager_name = COALESCE(relationship_manager_name, bank_contact_person),
                relationship_manager_phone = COALESCE(relationship_manager_phone, bank_contact_phone),
                relationship_manager_email = COALESCE(relationship_manager_email, bank_contact_email),
                offer_summary = COALESCE(offer_summary, offer_comment),
                early_payment_discount = COALESCE(early_payment_discount, 0),
                late_payment_penalty = COALESCE(late_payment_penalty, 0),
                processing_fee = COALESCE(processing_fee, 0)
            WHERE 
                approved_financing_amount IS NULL 
                OR proposed_repayment_period_months IS NULL 
                OR interest_rate IS NULL 
                OR monthly_installment_amount IS NULL 
                OR grace_period_months IS NULL
        `);
        
        console.log(`✅ Updated ${updateResult.rowCount} existing records with default values`);

        await client.query('COMMIT');
        
        console.log('\n🎉 Bank offer fields added successfully!');
        
        // Display final table structure
        console.log('\n📋 Final application_offers table structure:');
        console.log('==================================================');
        
        const structureResult = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'application_offers' 
            ORDER BY ordinal_position
        `);
        
        structureResult.rows.forEach((column, index) => {
            console.log(`${index + 1}. ${column.column_name} (${column.data_type}) ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
            if (column.column_default) {
                console.log(`   Default: ${column.column_default}`);
            }
        });
        
        console.log(`\n📊 Total columns: ${structureResult.rows.length}`);
        
        // Show the new bank offer fields
        console.log('\n🎯 New Bank Offer Fields Added:');
        console.log('=====================================');
        console.log('• approved_financing_amount - Approved Financing Amount (SAR)');
        console.log('• proposed_repayment_period_months - Proposed Repayment Period (months)');
        console.log('• interest_rate - Interest Rate (%)');
        console.log('• monthly_installment_amount - Monthly Installment Amount (SAR)');
        console.log('• grace_period_months - Grace Period (if applicable)');
        console.log('• relationship_manager_name - Relationship Manager Name');
        console.log('• relationship_manager_phone - Relationship Manager Phone');
        console.log('• relationship_manager_email - Relationship Manager Email');
        console.log('• offer_document - File Upload Support');
        console.log('• offer_summary - Enhanced Offer Summary');
        console.log('• special_conditions - Special Terms and Conditions');
        console.log('• early_payment_discount - Early Payment Discount (%)');
        console.log('• late_payment_penalty - Late Payment Penalty (%)');
        console.log('• collateral_requirements - Collateral Requirements');
        console.log('• processing_fee - Processing Fee (SAR)');
        console.log('• insurance_requirements - Insurance Requirements');
        
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
    addBankOfferFields()
        .then(() => {
            console.log('\n✅ Migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { addBankOfferFields };
