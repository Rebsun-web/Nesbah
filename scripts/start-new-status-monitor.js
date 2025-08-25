const statusTransitionMonitor = require('../src/lib/cron/new-status-transitions.cjs');

async function startNewStatusMonitor() {
    try {
        console.log('🚀 Starting new status transition monitor...');
        await statusTransitionMonitor.start();
        
        // Keep the process running
        process.on('SIGINT', async () => {
            console.log('\n🛑 Received SIGINT, stopping monitor...');
            await statusTransitionMonitor.stop();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            console.log('\n🛑 Received SIGTERM, stopping monitor...');
            await statusTransitionMonitor.stop();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start status transition monitor:', error);
        process.exit(1);
    }
}

// Start the monitor if this file is executed directly
if (require.main === module) {
    startNewStatusMonitor();
}

module.exports = { startNewStatusMonitor };
