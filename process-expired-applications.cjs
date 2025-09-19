#!/usr/bin/env node

/**
 * Manual script to process expired applications
 * This can be run independently to handle expired applications immediately
 */

import { AuctionExpiryHandler } from './src/lib/auction-expiry-handler.js';
import backgroundTaskManager from './src/lib/background-tasks.js';

async function processExpiredApplications() {
    console.log('🚀 Starting manual processing of expired applications...');
    
    try {
        // Start background task manager if not running
        if (!backgroundTaskManager.isRunning) {
            console.log('🔄 Starting background task manager...');
            backgroundTaskManager.start();
            
            // Wait a moment for it to initialize
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Process expired auctions
        console.log('⏰ Processing expired auctions...');
        const result = await AuctionExpiryHandler.handleExpiredAuctions();
        
        console.log('✅ Processing completed:');
        console.log(`   - Processed: ${result.processed} applications`);
        console.log(`   - Completed: ${result.completed} applications`);
        console.log(`   - Ignored: ${result.ignored} applications`);
        
        if (result.processed === 0) {
            console.log('ℹ️ No expired applications found');
        }
        
        // Check for urgent applications
        console.log('⚠️ Checking for urgent applications...');
        const urgentApplications = await AuctionExpiryHandler.getUrgentApplications();
        
        if (urgentApplications.length > 0) {
            console.log(`Found ${urgentApplications.length} applications approaching expiry:`);
            urgentApplications.forEach(app => {
                console.log(`   - App #${app.application_id} (${app.trade_name}): ${app.hours_until_expiry.toFixed(1)} hours until expiry`);
            });
        } else {
            console.log('✅ No urgent applications found');
        }
        
    } catch (error) {
        console.error('❌ Error processing expired applications:', error);
        process.exit(1);
    } finally {
        // Stop background task manager
        console.log('🛑 Stopping background task manager...');
        backgroundTaskManager.stop();
        process.exit(0);
    }
}

// Run the script
processExpiredApplications();
