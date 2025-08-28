const { AuctionExpiryHandler } = require('../src/lib/auction-expiry-handler.js');

async function testAuctionExpiry() {
    try {
        console.log('🧪 Testing auction expiry handler...\n');
        
        // Check for expired auctions
        const result = await AuctionExpiryHandler.handleExpiredAuctions();
        
        console.log('\n📊 Results:');
        console.log(`  Processed: ${result.processed}`);
        console.log(`  Completed: ${result.completed}`);
        console.log(`  Ignored: ${result.ignored}`);
        
        // Get urgent applications
        const urgent = await AuctionExpiryHandler.getUrgentApplications();
        console.log(`\n⚠️  Urgent applications (expiring within 2 hours): ${urgent.length}`);
        
        if (urgent.length > 0) {
            console.log('\n📋 Urgent applications:');
            urgent.forEach(app => {
                console.log(`  - #${app.application_id} (${app.trade_name}) - ${app.hours_until_expiry.toFixed(1)} hours left`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error testing auction expiry:', error);
    }
}

testAuctionExpiry();
