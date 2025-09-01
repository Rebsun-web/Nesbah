// Background task initialization
// This file ensures background tasks start when the application launches

import backgroundTaskManager from './background-tasks'

let isInitialized = false

export function initializeBackgroundTasks() {
    if (isInitialized) {
        console.log('⚠️  Background tasks already initialized')
        return
    }

    if (typeof window !== 'undefined') {
        console.log('⚠️  Background tasks should only be initialized on server side')
        return
    }

    try {
        console.log('🚀 Initializing background tasks...')
        
        // Start the background task manager
        backgroundTaskManager.start()
        
        isInitialized = true
        console.log('✅ Background tasks initialized successfully')
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Received SIGINT, stopping background tasks...')
            backgroundTaskManager.stop()
            process.exit(0)
        })

        process.on('SIGTERM', () => {
            console.log('\n🛑 Received SIGTERM, stopping background tasks...')
            backgroundTaskManager.stop()
            process.exit(0)
        })

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('💥 Uncaught Exception:', error)
            backgroundTaskManager.stop()
            process.exit(1)
        })

        process.on('unhandledRejection', (reason, promise) => {
            console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
            backgroundTaskManager.stop()
            process.exit(1)
        })

    } catch (error) {
        console.error('❌ Failed to initialize background tasks:', error)
        throw error
    }
}

// Auto-initialize if this module is imported on server side
if (typeof window === 'undefined') {
    // Small delay to ensure everything is ready
    setTimeout(() => {
        try {
            initializeBackgroundTasks()
        } catch (error) {
            console.error('❌ Auto-initialization failed:', error)
        }
    }, 3000) // 3 second delay
}

export default initializeBackgroundTasks
