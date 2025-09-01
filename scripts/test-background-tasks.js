require('dotenv').config();

console.log('🧪 Testing Background Task Manager...\n');

// Test the background task manager
async function testBackgroundTasks() {
    try {
        // Import the background task manager
        const { default: backgroundTaskManager } = await import('../src/lib/background-tasks.js');
        
        console.log('✅ Background task manager imported successfully');
        
        // Check current status
        const status = backgroundTaskManager.getStatus();
        console.log('📊 Current status:', status);
        
        // Start the manager
        console.log('\n🚀 Starting background task manager...');
        backgroundTaskManager.start();
        
        // Wait a moment and check status again
        setTimeout(() => {
            const newStatus = backgroundTaskManager.getStatus();
            console.log('📊 Status after start:', newStatus);
            
            if (backgroundTaskManager.isRunning) {
                console.log('✅ Background task manager is running successfully!');
                console.log('📋 Active tasks:');
                newStatus.tasks.forEach(task => {
                    console.log(`   - ${task.name}: ${task.isActive ? 'ACTIVE' : 'INACTIVE'} (${task.interval}ms)`);
                });
            } else {
                console.log('❌ Background task manager failed to start');
            }
            
            // Stop after test
            setTimeout(() => {
                console.log('\n🛑 Stopping background task manager...');
                backgroundTaskManager.stop();
                console.log('✅ Test completed');
                process.exit(0);
            }, 2000);
            
        }, 3000);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run the test
testBackgroundTasks();
