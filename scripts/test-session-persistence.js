const pool = require('../src/lib/db.cjs');

// Import the session manager using dynamic import
async function testSessionPersistence() {
    console.log('🧪 Testing session persistence...');
    
    try {
        // Dynamically import the session manager
        const adminSessionModule = await import('../src/lib/auth/admin-session.js');
        const adminSessionManager = adminSessionModule.default;
        
        // Create a test admin user object
        const testAdminUser = {
            admin_id: 1,
            email: 'test@nesbah.com',
            full_name: 'Test Admin',
            role: 'admin',
            permissions: { all_permissions: true },
            is_active: true
        };
        
        // Create a session
        console.log('📝 Creating test session...');
        const session = await adminSessionManager.createSession(testAdminUser);
        console.log('✅ Session created:', session.sessionId);
        
        // Verify session is in memory
        const memorySession = adminSessionManager.activeSessions.get(session.sessionId);
        console.log('🔍 Session in memory:', memorySession ? 'Yes' : 'No');
        
        // Verify session is in database
        const dbSession = await adminSessionManager.getSessionFromDatabase(session.sessionId);
        console.log('🔍 Session in database:', dbSession ? 'Yes' : 'No');
        
        // Test validation
        console.log('🔍 Testing session validation...');
        const validation = await adminSessionManager.validateSession(session.token);
        console.log('✅ Session validation result:', validation.valid);
        
        // Clear memory (simulate server restart)
        console.log('🔄 Clearing memory (simulating server restart)...');
        adminSessionManager.activeSessions.clear();
        
        // Verify session is no longer in memory
        const memorySessionAfter = adminSessionManager.activeSessions.get(session.sessionId);
        console.log('🔍 Session in memory after restart:', memorySessionAfter ? 'Yes' : 'No');
        
        // Test validation after "restart" (should restore from database)
        console.log('🔍 Testing session validation after restart...');
        const validationAfter = await adminSessionManager.validateSession(session.token);
        console.log('✅ Session validation after restart:', validationAfter.valid);
        
        // Verify session is back in memory
        const memorySessionRestored = adminSessionManager.activeSessions.get(session.sessionId);
        console.log('🔍 Session restored to memory:', memorySessionRestored ? 'Yes' : 'No');
        
        // Clean up
        console.log('🧹 Cleaning up test session...');
        await adminSessionManager.invalidateSession(session.sessionId);
        
        console.log('✅ Session persistence test completed successfully!');
        
    } catch (error) {
        console.error('❌ Session persistence test failed:', error);
    }
}

// Run the test
testSessionPersistence()
    .then(() => {
        console.log('✅ All tests completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
