// Server-side initialization only
let isInitialized = false;

export function initializeServer() {
    if (isInitialized) {
        console.log('⚠️  Server already initialized');
        return;
    }

    console.log('🚀 Initializing server...');
    
    try {
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Received SIGINT, shutting down gracefully...');
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
            process.exit(0);
        });

        isInitialized = true;
        console.log('✅ Server initialized successfully');
    } catch (error) {
        console.error('❌ Server initialization failed:', error);
    }
}

// Auto-initialize if this module is imported on server side
if (typeof window === 'undefined') {
    // Only run on server side
    initializeServer();
}