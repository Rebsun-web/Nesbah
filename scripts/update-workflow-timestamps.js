const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateWorkflowTimestamps() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('🔧 Updating application workflow timestamps...');
        
        // Update application window start times for applications that don't have them
        await client.query(`
            UPDATE submitted_applications 
            SET application_window_started_at = submitted_at
            WHERE application_window_started_at IS NULL 
            AND status IN ('pending_offers', 'offer_received', 'completed', 'deal_won', 'deal_lost')
        `);
        
        // Update application window end times based on auction_end_time
        await client.query(`
            UPDATE submitted_applications 
            SET application_window_ended_at = auction_end_time
            WHERE application_window_ended_at IS NULL 
            AND auction_end_time IS NOT NULL
        `);
        
        // Update completion times for completed applications
        await client.query(`
            UPDATE submitted_applications 
            SET completed_at = CURRENT_TIMESTAMP
            WHERE completed_at IS NULL 
            AND status IN ('completed', 'deal_won', 'deal_lost')
        `);
        
        console.log('✅ Updated application workflow timestamps');
        
        console.log('🔧 Updating offer workflow timestamps...');
        
        // Update offer window start times
        await client.query(`
            UPDATE application_offers 
            SET offer_window_started_at = submitted_at
            WHERE offer_window_started_at IS NULL 
            AND status IN ('submitted', 'deal_won', 'deal_lost')
        `);
        
        // Update offer window end times based on offer_selection_deadline
        await client.query(`
            UPDATE application_offers 
            SET offer_window_ended_at = offer_selection_deadline
            WHERE offer_window_ended_at IS NULL 
            AND offer_selection_deadline IS NOT NULL
        `);
        
        // Update offer acceptance times for won deals
        await client.query(`
            UPDATE application_offers 
            SET offer_accepted_at = CURRENT_TIMESTAMP
            WHERE offer_accepted_at IS NULL 
            AND status = 'deal_won'
        `);
        
        console.log('✅ Updated offer workflow timestamps');
        
        await client.query('COMMIT');
        console.log('🎉 Workflow timestamps updated successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error updating workflow timestamps:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the update
updateWorkflowTimestamps()
    .then(() => {
        console.log('✅ Workflow timestamp update completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Workflow timestamp update failed:', error);
        process.exit(1);
    });
