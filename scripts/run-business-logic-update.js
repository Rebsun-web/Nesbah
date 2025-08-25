require('dotenv').config({ path: '.env' });
const { updateBusinessLogic } = require('../src/lib/update-business-logic.cjs');

async function runBusinessLogicUpdate() {
    try {
        console.log('🔄 Starting business logic update...');
        console.log('📋 This will update the status workflow to the new simplified system');
        console.log('📋 New statuses: live_auction → approved_leads → complete/ignored');
        console.log('');
        
        // Ask for confirmation
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const answer = await new Promise((resolve) => {
            rl.question('⚠️  This will update all existing applications. Are you sure you want to continue? (yes/no): ', resolve);
        });
        
        rl.close();

        if (answer.toLowerCase() !== 'yes') {
            console.log('❌ Update cancelled by user');
            process.exit(0);
        }

        console.log('');
        console.log('🚀 Running business logic update...');
        
        await updateBusinessLogic();
        
        console.log('');
        console.log('✅ Business logic update completed successfully!');
        console.log('');
        console.log('📋 Next steps:');
        console.log('1. Start the new status monitor: node scripts/start-new-status-monitor.js');
        console.log('2. Test the new workflow with sample applications');
        console.log('3. Verify that business users can see bank offers');
        console.log('');
        console.log('📚 For more information, see BUSINESS_LOGIC_UPDATE_SUMMARY.md');
        
    } catch (error) {
        console.error('❌ Business logic update failed:', error);
        process.exit(1);
    }
}

// Run the update if this file is executed directly
if (require.main === module) {
    runBusinessLogicUpdate();
}

module.exports = { runBusinessLogicUpdate };
