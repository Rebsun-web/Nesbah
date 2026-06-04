/**
 * Auction Configuration
 * Centralized configuration for auction timing and behavior
 */

// Get auction duration from environment variable or use default
const DEFAULT_AUCTION_DURATION_HOURS = parseInt(process.env.DEFAULT_AUCTION_HOURS) || 48;

// Master switch for the auction time-frame.
// TEMPORARILY DISABLED: when false, applications never expire — they stay in 'live_auction'
// (and never become 'ignored') until they receive an offer, at which point they become 'completed'.
// This is a plain constant (not an env var) so client and server evaluate it identically.
// Flip to true to re-enable the auction clock (expiry, 'ignored' transitions, countdowns).
export const AUCTION_TIMEFRAME_ENABLED = false;

// Export configuration object
export const auctionConfig = {
    // Duration settings
    durationHours: DEFAULT_AUCTION_DURATION_HOURS,
    durationSeconds: DEFAULT_AUCTION_DURATION_HOURS * 60 * 60,
    durationMilliseconds: DEFAULT_AUCTION_DURATION_HOURS * 60 * 60 * 1000,
    
    // SQL interval string for database queries
    sqlInterval: `${DEFAULT_AUCTION_DURATION_HOURS} hours`,
    
    // Warning thresholds
    warningThresholds: {
        endingSoonHours: 2, // Show warning when 2 hours remaining
        endingSoonMinutes: 30, // Show warning when 30 minutes remaining
    },
    
    // Utility functions
    utils: {
        /**
         * Calculate auction end time from submission time
         * @param {Date|string} submittedAt - Submission time
         * @returns {Date} Auction end time
         */
        calculateEndTime(submittedAt) {
            const submitTime = new Date(submittedAt);
            return new Date(submitTime.getTime() + auctionConfig.durationMilliseconds);
        },
        
        /**
         * Calculate auction start time from end time
         * @param {Date|string} endTime - Auction end time
         * @returns {Date} Auction start time
         */
        calculateStartTime(endTime) {
            const end = new Date(endTime);
            return new Date(end.getTime() - auctionConfig.durationMilliseconds);
        },
        
        /**
         * Get time remaining in milliseconds
         * @param {Date|string} endTime - Auction end time
         * @returns {number} Time remaining in milliseconds
         */
        getTimeRemaining(endTime) {
            const end = new Date(endTime);
            const now = new Date();
            return end.getTime() - now.getTime();
        },
        
        /**
         * Check if auction is ending soon
         * @param {Date|string} endTime - Auction end time
         * @returns {boolean} True if ending within warning threshold
         */
        isEndingSoon(endTime) {
            const timeRemaining = auctionConfig.utils.getTimeRemaining(endTime);
            const warningThresholdMs = auctionConfig.warningThresholds.endingSoonHours * 60 * 60 * 1000;
            return timeRemaining > 0 && timeRemaining <= warningThresholdMs;
        },
        
        /**
         * Check if auction has expired
         * @param {Date|string} endTime - Auction end time
         * @returns {boolean} True if auction has expired
         */
        isExpired(endTime) {
            return auctionConfig.utils.getTimeRemaining(endTime) <= 0;
        }
    }
};

// Export individual values for backward compatibility
export const AUCTION_DURATION_HOURS = auctionConfig.durationHours;
export const AUCTION_DURATION_SECONDS = auctionConfig.durationSeconds;
export const AUCTION_DURATION_MILLISECONDS = auctionConfig.durationMilliseconds;
export const AUCTION_SQL_INTERVAL = auctionConfig.sqlInterval;

export default auctionConfig;
