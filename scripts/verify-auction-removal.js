import pool from '../src/lib/db.js';

async function verifyAuctionRemoval() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Verifying auction system removal...\n');

        // 1. Check if auction-related tables were removed
        console.log('📋 Checking auction-related tables...');
        
        const tablesToCheck = [
            { name: 'offer_selections', shouldExist: false },
            { name: 'application_revenue', shouldExist: false },
            { name: 'application_offers', shouldExist: true } // Should be preserved
        ];

        for (const table of tablesToCheck) {
            const result = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                );
            `, [table.name]);
            
            const exists = result.rows[0].exists;
            const status = exists ? '✅ EXISTS' : '❌ REMOVED';
            const expected = table.shouldExist ? 'SHOULD EXIST' : 'SHOULD BE REMOVED';
            
            console.log(`   ${table.name}: ${status} (${expected})`);
            
            if (exists !== table.shouldExist) {
                console.log(`   ⚠️  WARNING: ${table.name} ${exists ? 'still exists' : 'was removed'} but ${table.shouldExist ? 'should exist' : 'should be removed'}`);
            }
        }

        // 2. Check if auction-related columns were removed
        console.log('\n📋 Checking auction-related columns...');
        
        const columnsToCheck = [
            { table: 'submitted_applications', column: 'auction_end_time', shouldExist: false },
            { table: 'submitted_applications', column: 'offer_selection_end_time', shouldExist: false },
            { table: 'submitted_applications', column: 'revenue_collected', shouldExist: false },
            { table: 'submitted_applications', column: 'offers_count', shouldExist: false },
            { table: 'pos_application', column: 'auction_end_time', shouldExist: false },
            { table: 'pos_application', column: 'offer_selection_end_time', shouldExist: false }
        ];

        for (const col of columnsToCheck) {
            const result = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = $1 
                    AND column_name = $2
                );
            `, [col.table, col.column]);
            
            const exists = result.rows[0].exists;
            const status = exists ? '✅ EXISTS' : '❌ REMOVED';
            const expected = col.shouldExist ? 'SHOULD EXIST' : 'SHOULD BE REMOVED';
            
            console.log(`   ${col.table}.${col.column}: ${status} (${expected})`);
            
            if (exists !== col.shouldExist) {
                console.log(`   ⚠️  WARNING: ${col.table}.${col.column} ${exists ? 'still exists' : 'was removed'} but ${col.shouldExist ? 'should exist' : 'should be removed'}`);
            }
        }

        // 3. Check application statuses
        console.log('\n📋 Checking application statuses...');
        
        const statusResult = await client.query(`
            SELECT status, COUNT(*) as count 
            FROM submitted_applications 
            GROUP BY status 
            ORDER BY count DESC;
        `);
        
        console.log('   Current application status distribution:');
        for (const row of statusResult.rows) {
            console.log(`   - ${row.status}: ${row.count} applications`);
        }

        // 4. Check for any remaining auction-related statuses
        const auctionStatuses = ['offer_received', 'deal_won', 'deal_lost', 'deal_expired'];
        const remainingAuctionStatuses = statusResult.rows.filter(row => 
            auctionStatuses.includes(row.status)
        );
        
        if (remainingAuctionStatuses.length > 0) {
            console.log('\n⚠️  WARNING: Found applications with auction-related statuses:');
            for (const row of remainingAuctionStatuses) {
                console.log(`   - ${row.status}: ${row.count} applications`);
            }
        } else {
            console.log('\n✅ No applications with auction-related statuses found');
        }

        // 5. Check status constraints
        console.log('\n📋 Checking status constraints...');
        
        const constraintResult = await client.query(`
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint 
            WHERE conrelid = 'submitted_applications'::regclass 
            AND conname = 'submitted_applications_status_check';
        `);
        
        if (constraintResult.rows.length > 0) {
            console.log('   ✅ Status constraint exists on submitted_applications');
            console.log(`   Definition: ${constraintResult.rows[0].definition}`);
        } else {
            console.log('   ❌ Status constraint missing on submitted_applications');
        }

        console.log('\n✅ Verification complete!');
        
    } catch (error) {
        console.error('❌ Verification failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run verification if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    verifyAuctionRemoval()
        .then(() => {
            console.log('Verification completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Verification failed:', error);
            process.exit(1);
        });
}
