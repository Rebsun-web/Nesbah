import auctionNotificationHandler from './auction-notification-handler.js';

/**
 * Initialize the email notification system on application startup
 */
export async function initializeNotificationSystem() {
    try {
        console.log('🚀 Initializing email notification system...');
        
        // Start the auction notification handler
        auctionNotificationHandler.start();
        
        console.log('✅ Email notification system initialized successfully');
        
        // Log the current status
        const status = auctionNotificationHandler.getStatus();
        console.log('📊 Notification handler status:', status);
        
    } catch (error) {
        console.error('❌ Failed to initialize email notification system:', error);
        // Don't throw - allow application to continue without notifications
    }
}

/**
 * Gracefully shutdown the notification system
 */
export async function shutdownNotificationSystem() {
    try {
        console.log('🛑 Shutting down email notification system...');
        
        // Stop the auction notification handler
        auctionNotificationHandler.stop();
        
        console.log('✅ Email notification system shut down successfully');
        
    } catch (error) {
        console.error('❌ Error shutting down email notification system:', error);
    }
}

/**
 * Get the current status of all notification systems
 */
export function getNotificationSystemStatus() {
    return {
        auctionHandler: auctionNotificationHandler.getStatus(),
        timestamp: new Date().toISOString()
    };
}
