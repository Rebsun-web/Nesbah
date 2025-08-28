const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'nesbah_dev',
    user: 'postgres',
    password: 'password',
});

async function fixExistingOffers() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Fixing existing offers data...');
        
        // Get all offers that exist in application_offers but the bank is not in purchased_by array
        const offersToFix = await client.query(`
            SELECT 
                ao.offer_id,
                ao.submitted_application_id,
                ao.bank_user_id,
                pa.purchased_by,
                pa.offers_count,
                pa.revenue_collected
            FROM application_offers ao
            JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
            WHERE NOT (ao.bank_user_id = ANY(pa.purchased_by))
            ORDER BY ao.submitted_application_id, ao.bank_user_id
        `);
        
        console.log(`📊 Found ${offersToFix.rows.length} offers that need to be fixed`);
        
        if (offersToFix.rows.length === 0) {
            console.log('✅ All offers are already properly tracked');
            return;
        }
        
        let fixedCount = 0;
        
        for (const offer of offersToFix.rows) {
            try {
                // Add bank to purchased_by array and update revenue
                await client.query(`
                    UPDATE pos_application 
                    SET 
                        purchased_by = array_append(purchased_by, $1),
                        revenue_collected = revenue_collected + 25.00
                    WHERE application_id = $2
                `, [offer.bank_user_id, offer.submitted_application_id]);
                
                console.log(`✅ Fixed offer ${offer.offer_id} for application ${offer.submitted_application_id}`);
                fixedCount++;
                
            } catch (error) {
                console.error(`❌ Error fixing offer ${offer.offer_id}:`, error.message);
            }
        }
        
        console.log(`\n🎉 Successfully fixed ${fixedCount} out of ${offersToFix.rows.length} offers`);
        
        // Verify the fix by checking the analytics data
        console.log('\n📊 Verifying the fix...');
        const verificationQuery = await client.query(`
            SELECT 
                u.entity_name as bank_name,
                COUNT(DISTINCT pa.application_id) as total_applications,
                COUNT(DISTINCT CASE WHEN bu.user_id = ANY(pa.purchased_by) THEN pa.application_id END) as applications_with_offers,
                ROUND(
                    CASE 
                        WHEN COUNT(DISTINCT pa.application_id) > 0 
                        THEN (COUNT(DISTINCT CASE WHEN bu.user_id = ANY(pa.purchased_by) THEN pa.application_id END)::DECIMAL / COUNT(DISTINCT pa.application_id)) * 100 
                        ELSE 0 
                    END, 2
                ) as conversion_rate
            FROM pos_application pa
            CROSS JOIN LATERAL unnest(pa.opened_by) AS opened_bank_id
            JOIN bank_users bu ON opened_bank_id = bu.user_id
            JOIN users u ON bu.user_id = u.user_id
            WHERE u.user_type = 'bank_user'
            GROUP BY u.entity_name, u.email, bu.user_id
            ORDER BY conversion_rate DESC
        `);
        
        console.log('\n🏦 Updated Bank Performance:');
        verificationQuery.rows.forEach(row => {
            console.log(`  ${row.bank_name}: ${row.applications_with_offers} offers (${row.conversion_rate}% conversion)`);
        });
        
    } catch (error) {
        console.error('❌ Error fixing existing offers:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

fixExistingOffers();
