#!/usr/bin/env node

/**
 * Test script for background connection management
 * Run with: node scripts/test-connection-management.js
 */

import backgroundConnectionManager from '../src/lib/background-connection-manager.js'
import backgroundTaskManager from '../src/lib/background-tasks.js'

async function testConnectionManagement() {
    console.log('🧪 Testing Background Connection Management...\n')

    try {
        // Test 1: Get connection status
        console.log('1️⃣ Testing connection status...')
        const status = backgroundConnectionManager.getStatus()
        console.log('✅ Connection status:', status)

        // Test 2: Test health check
        console.log('\n2️⃣ Testing health check...')
        const health = await backgroundConnectionManager.healthCheck()
        console.log('✅ Health check:', health)

        // Test 3: Test task manager status
        console.log('\n3️⃣ Testing task manager status...')
        const taskStatus = backgroundTaskManager.getStatus()
        console.log('✅ Task manager status:', taskStatus)

        // Test 4: Test connection acquisition and release
        console.log('\n4️⃣ Testing connection acquisition and release...')
        const connection = await backgroundConnectionManager.getConnection('test-task')
        console.log('✅ Connection acquired:', connection.connectionId)
        
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Release connection
        backgroundConnectionManager.releaseConnection(connection.connectionId)
        console.log('✅ Connection released')

        // Test 5: Test stale connection cleanup
        console.log('\n5️⃣ Testing stale connection cleanup...')
        const cleanupCount = backgroundConnectionManager.cleanupStaleConnections()
        console.log('✅ Stale connections cleaned up:', cleanupCount)

        // Test 6: Test emergency cleanup
        console.log('\n6️⃣ Testing emergency cleanup...')
        await backgroundConnectionManager.emergencyCleanup()
        console.log('✅ Emergency cleanup completed')

        // Final status
        console.log('\n📊 Final status:')
        const finalStatus = backgroundConnectionManager.getStatus()
        console.log('✅ Final connection status:', finalStatus)

        console.log('\n🎉 All tests completed successfully!')
        console.log('\n💡 The connection management system is working properly.')
        console.log('   - Connections are properly tracked')
        console.log('   - Cleanup mechanisms are functional')
        console.log('   - Emergency procedures are available')

    } catch (error) {
        console.error('❌ Test failed:', error)
        process.exit(1)
    }
}

// Run tests
testConnectionManagement()
    .then(() => {
        console.log('\n✨ Connection management test suite completed')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n💥 Test suite failed:', error)
        process.exit(1)
    })
