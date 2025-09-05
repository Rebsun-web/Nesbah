// Auto-start background tasks when the server starts
// This file ensures background tasks are automatically started in production

import backgroundTaskManager from './background-tasks.js'

let isAutoStarted = false

export function autoStartBackgroundTasks() {
    if (isAutoStarted) {
        console.log('⚠️  Background tasks already auto-started')
        return
    }

    if (typeof window !== 'undefined') {
        console.log('⚠️  Background tasks should only be auto-started on server side')
        return
    }

    try {
        console.log('🚀 Auto-starting background tasks...')
        
        // Start the background task manager
        backgroundTaskManager.start()
        
        isAutoStarted = true
        console.log('✅ Background tasks auto-started successfully')
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Received SIGINT, stopping background tasks...')
            backgroundTaskManager.stop()
        })

        process.on('SIGTERM', () => {
            console.log('\n🛑 Received SIGTERM, stopping background tasks...')
            backgroundTaskManager.stop()
        })

    } catch (error) {
        console.error('❌ Failed to auto-start background tasks:', error)
        // Don't throw - we don't want to crash the server if background tasks fail
    }
}

// Auto-start when this module is imported (server-side only)
if (typeof window === 'undefined') {
    // Small delay to ensure the server is fully ready
    setTimeout(() => {
        autoStartBackgroundTasks()
    }, 5000) // 5 second delay to ensure everything is ready
}

export default autoStartBackgroundTasks
