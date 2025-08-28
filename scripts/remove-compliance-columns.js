const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function removeComplianceColumns() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Removing compliance columns from application_offers table...');
        
        await client.query('BEGIN');

        // Check if columns exist before removing them
        const checkColumnsQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'application_offers' 
            AND column_name IN ('compliance_certifications', 'regulatory_approvals')
        `;
        
        const existingColumns = await client.query(checkColumnsQuery);
        
        if (existingColumns.rows.length > 0) {
            console.log('📋 Found columns to remove:', existingColumns.rows.map(row => row.column_name));
            
            // Remove compliance_certifications column if it exists
            if (existingColumns.rows.some(row => row.column_name === 'compliance_certifications')) {
                await client.query('ALTER TABLE application_offers DROP COLUMN IF EXISTS compliance_certifications');
                console.log('✅ Removed compliance_certifications column');
            }
            
            // Remove regulatory_approvals column if it exists
            if (existingColumns.rows.some(row => row.column_name === 'regulatory_approvals')) {
                await client.query('ALTER TABLE application_offers DROP COLUMN IF EXISTS regulatory_approvals');
                console.log('✅ Removed regulatory_approvals column');
            }
        } else {
            console.log('ℹ️ No compliance columns found to remove');
        }

        await client.query('COMMIT');
        
        console.log('✅ Successfully removed compliance columns from application_offers table!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error removing compliance columns:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the column removal
if (require.main === module) {
    removeComplianceColumns()
        .then(() => {
            console.log('🎉 Compliance columns removal completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Compliance columns removal failed:', error);
            process.exit(1);
        });
}

module.exports = { removeComplianceColumns };
