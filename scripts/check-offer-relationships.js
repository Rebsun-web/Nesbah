#!/usr/bin/env node

/**
 * Check Offer Relationships Script
 * This script investigates why bank offers are disappearing from the business portal
 */

const { Pool } = require('pg');

console.log('🔍 Checking Offer Data Relationships...\n');

// Database configuration
const poolConfig = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
} : {
  host: '34.166.77.134',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Riyadh123!@#',
  ssl: {
    rejectUnauthorized: false,
  },
};

async function checkOfferRelationships() {
    let pool = null;
    
    try {
        console.log('📊 Connecting to database...');
        pool = new Pool(poolConfig);
        
        // Test connection
        const client = await pool.connect();
        console.log('✅ Database connected successfully');
        
        console.log('\n🔍 Step 1: Checking submitted_applications table...');
        
        const submittedAppsQuery = `
            SELECT 
                id, 
                application_id, 
                business_user_id, 
                status,
                offers_count,
                auction_end_time
            FROM submitted_applications 
            ORDER BY id DESC 
            LIMIT 10
        `;
        
        const submittedApps = await client.query(submittedAppsQuery);
        console.log(`📋 Found ${submittedApps.rows.length} submitted applications:`);
        submittedApps.rows.forEach(app => {
            console.log(`   - ID: ${app.id}, App ID: ${app.application_id}, Business: ${app.business_user_id}, Status: ${app.status}, Offers: ${app.offers_count}`);
        });
        
        console.log('\n🔍 Step 2: Checking application_offers table...');
        
        const offersQuery = `
            SELECT 
                offer_id,
                submitted_application_id,
                submitted_by_user_id,
                status,
                submitted_at,
                offer_device_setup_fee
            FROM application_offers 
            ORDER BY submitted_at DESC 
            LIMIT 10
        `;
        
        const offers = await client.query(offersQuery);
        console.log(`💰 Found ${offers.rows.length} offers:`);
        offers.rows.forEach(offer => {
            console.log(`   - Offer ID: ${offer.offer_id}, Submitted App ID: ${offer.submitted_application_id}, Bank: ${offer.submitted_by_user_id}, Status: ${offer.status}, Fee: ${offer.offer_device_setup_fee}`);
        });
        
        console.log('\n🔍 Step 3: Checking data relationships...');
        
        const relationshipQuery = `
            SELECT 
                sa.id as submitted_app_id,
                sa.application_id,
                sa.business_user_id,
                sa.status as app_status,
                sa.offers_count,
                ao.offer_id,
                ao.submitted_application_id,
                ao.status as offer_status,
                u.entity_name as bank_name,
                ao.submitted_at as offer_submitted_at
            FROM submitted_applications sa
            LEFT JOIN application_offers ao ON sa.id = ao.submitted_application_id
            LEFT JOIN users u ON ao.submitted_by_user_id = u.user_id
            ORDER BY sa.id DESC
            LIMIT 10
        `;
        
        const relationships = await client.query(relationshipQuery);
        console.log(`🔗 Data relationships:`);
        relationships.rows.forEach(rel => {
            console.log(`   - Submitted App ID: ${rel.submitted_app_id}, Application ID: ${rel.application_id}, Business: ${rel.business_user_id}`);
            console.log(`     Status: ${rel.app_status}, Offers Count: ${rel.offers_count}`);
            if (rel.offer_id) {
                console.log(`     Offer: ${rel.offer_id} from ${rel.bank_name} (${rel.offer_status}) at ${rel.offer_submitted_at}`);
            } else {
                console.log(`     No offers found`);
            }
            console.log('');
        });
        
        console.log('\n🔍 Step 4: Checking for orphaned offers...');
        
        const orphanedOffersQuery = `
            SELECT 
                ao.offer_id,
                ao.submitted_application_id,
                ao.submitted_by_user_id,
                ao.status,
                ao.submitted_at
            FROM application_offers ao
            LEFT JOIN submitted_applications sa ON ao.submitted_application_id = sa.id
            WHERE sa.id IS NULL
        `;
        
        const orphanedOffers = await client.query(orphanedOffersQuery);
        if (orphanedOffers.rows.length > 0) {
            console.log(`⚠️  Found ${orphanedOffers.rows.length} orphaned offers (no matching submitted_applications):`);
            orphanedOffers.rows.forEach(offer => {
                console.log(`   - Offer ID: ${offer.offer_id}, Submitted App ID: ${offer.submitted_application_id} (MISSING)`);
            });
        } else {
            console.log('✅ No orphaned offers found');
        }
        
        console.log('\n🔍 Step 5: Checking business user applications...');
        
        // Check a specific business user's applications
        const businessUserQuery = `
            SELECT 
                sa.id,
                sa.application_id,
                sa.business_user_id,
                sa.status,
                sa.offers_count,
                COUNT(ao.offer_id) as actual_offers
            FROM submitted_applications sa
            LEFT JOIN application_offers ao ON sa.id = ao.submitted_application_id
            GROUP BY sa.id, sa.application_id, sa.business_user_id, sa.status, sa.offers_count
            ORDER BY sa.id DESC
            LIMIT 5
        `;
        
        const businessUserApps = await client.query(businessUserQuery);
        console.log(`🏢 Business user applications:`);
        businessUserApps.rows.forEach(app => {
            console.log(`   - App ID: ${app.application_id}, Status: ${app.status}, Expected Offers: ${app.offers_count}, Actual Offers: ${app.actual_offers}`);
        });
        
        client.release();
        
    } catch (error) {
        console.error('❌ Error during investigation:', error.message);
        
        if (pool) {
            try {
                await pool.end();
            } catch (endError) {
                console.error('❌ Failed to end pool:', endError.message);
            }
        }
        
        process.exit(1);
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

// Run the investigation
checkOfferRelationships().then(() => {
    console.log('\n🎉 Offer relationship investigation completed!');
    process.exit(0);
}).catch((error) => {
    console.error('\n💥 Offer relationship investigation failed:', error);
    process.exit(1);
});
