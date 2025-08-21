require('dotenv').config({ path: '.env.local' });

const backgroundJobManager = require('../src/lib/cron/background-job-manager.cjs');

async function startBackgroundJobs() {
    try {
        console.log('🚀 Starting Background Jobs...');
        console.log('📅', new Date().toISOString());
        
        await backgroundJobManager.start();
        
        console.log('✅ Background jobs started successfully');
        console.log('📊 Monitoring systems active:');
        console.log('   - Status Transition Monitor (every 60s)');
        console.log('   - Revenue Collection Monitor (every 5m)');
        console.log('   - Health Check Monitor (every 5m)');
        
        // Keep the process running
        process.on('SIGINT', async () => {
            console.log('\n🛑 Received SIGINT, stopping background jobs...');
            await backgroundJobManager.stop();
            console.log('✅ Background jobs stopped gracefully');
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            console.log('\n🛑 Received SIGTERM, stopping background jobs...');
            await backgroundJobManager.stop();
            console.log('✅ Background jobs stopped gracefully');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start background jobs:', error);
        process.exit(1);
    }
}

// Start the background jobs
startBackgroundJobs();
