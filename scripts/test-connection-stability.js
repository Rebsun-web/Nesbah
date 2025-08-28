const { exec } = require('child_process');

console.log('🧪 Testing Connection Stability...\n');

// Simulate multiple concurrent admin dashboard requests
const testRequests = [
    'curl -s http://localhost:3000/api/admin/applications/status-dashboard',
    'curl -s http://localhost:3000/api/admin/users/stats',
    'curl -s http://localhost:3000/api/admin/applications/analytics',
    'curl -s http://localhost:3000/api/admin/offers/analytics',
    'curl -s http://localhost:3000/api/admin/revenue/analytics?timeRange=7d',
    'curl -s http://localhost:3000/api/admin/time-metrics',
    'curl -s http://localhost:3000/api/admin/analytics/comprehensive'
];

async function testConcurrentRequests() {
    console.log('🚀 Testing concurrent admin dashboard requests...\n');
    
    const promises = testRequests.map((request, index) => {
        return new Promise((resolve) => {
            console.log(`📡 Request ${index + 1}: ${request.split('/').pop()}`);
            exec(request, (error, stdout, stderr) => {
                if (error) {
                    console.log(`❌ Request ${index + 1} failed: ${error.message}`);
                    resolve({ success: false, error: error.message });
                } else {
                    console.log(`✅ Request ${index + 1} completed`);
                    resolve({ success: true, response: stdout });
                }
            });
        });
    });

    const results = await Promise.all(promises);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\n📊 Results:`);
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    
    if (failed === 0) {
        console.log('\n🎉 All requests successful! Connection exhaustion appears to be resolved.');
    } else {
        console.log('\n⚠️  Some requests failed. Connection issues may still exist.');
        results.forEach((result, index) => {
            if (!result.success) {
                console.log(`   Request ${index + 1} error: ${result.error}`);
            }
        });
    }
}

// Run the test
testConcurrentRequests();
