require('dotenv').config({ path: '.env.local' });

const eventDrivenMonitor = require('../src/lib/event-driven-monitor.cjs');

async function startEventMonitor() {
    try {
        console.log('🚀 Starting Event-Driven Monitor...');
        console.log('📅', new Date().toISOString());

        await eventDrivenMonitor.start();

        console.log('✅ Event-driven monitor started successfully');
        console.log('📊 Event-driven monitoring active:');
        console.log('   - Database triggers for status changes');
        console.log('   - Webhook server for external events');
        console.log('   - Real-time notifications');
        console.log('   - Automated status transitions');

        // Keep the process running
        process.on('SIGINT', async () => {
            console.log('\n🛑 Received SIGINT, shutting down gracefully...');
            try {
                await eventDrivenMonitor.stop();
                console.log('✅ Event-driven monitor stopped successfully');
                process.exit(0);
            } catch (error) {
                console.error('❌ Error stopping event-driven monitor:', error);
                process.exit(1);
            }
        });

        process.on('SIGTERM', async () => {
            console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
            try {
                await eventDrivenMonitor.stop();
                console.log('✅ Event-driven monitor stopped successfully');
                process.exit(0);
            } catch (error) {
                console.error('❌ Error stopping event-driven monitor:', error);
                process.exit(1);
            }
        });

    } catch (error) {
        console.error('❌ Failed to start event-driven monitor:', error);
        process.exit(1);
    }
}

// Start the event-driven monitor
startEventMonitor();
