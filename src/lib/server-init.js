import backgroundTaskManager from './background-tasks.js'

// Server-side initialization
let isInitialized = false

export function initializeServer() {
    if (isInitialized) {
        console.log('⚠️  Server already initialized')
        return
    }

    console.log('🚀 Initializing server...')
    
    try {
        // Start background task manager
        backgroundTaskManager.start()
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Received SIGINT, shutting down gracefully...')
            backgroundTaskManager.stop()
            process.exit(0)
        })

        process.on('SIGTERM', () => {
            console.log('\n🛑 Received SIGTERM, shutting down gracefully...')
            backgroundTaskManager.stop()
            process.exit(0)
        })

        isInitialized = true
        console.log('✅ Server initialized successfully')
    } catch (error) {
        console.error('❌ Server initialization failed:', error)
    }
}

// Auto-initialize if this module is imported
if (typeof window === 'undefined') {
    // Only run on server side
    initializeServer()
}
