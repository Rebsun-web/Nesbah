/**
 * Translation Helpers
 * Dynamic content helpers for translations that depend on configuration
 */

import { auctionConfig } from './auction-config.js';

/**
 * Get auction duration text for translations
 * @param {string} language - Language code (en/ar)
 * @returns {string} Formatted auction duration text
 */
export function getAuctionDurationText(language = 'en') {
    const hours = auctionConfig.durationHours;
    
    if (language === 'ar') {
        return `${hours} ساعة`;
    }
    
    return `${hours} hours`;
}

/**
 * Get auction duration text for FAQ content
 * @param {string} language - Language code (en/ar)
 * @returns {string} Formatted FAQ content with auction duration
 */
export function getAuctionFAQContent(language = 'en') {
    const hours = auctionConfig.durationHours;
    
    if (language === 'ar') {
        return `قدم طلبك، واحصل على عروض تنافسية من البنوك خلال ${hours} ساعة، واختر أفضل خيار تمويل لعملك.`;
    }
    
    return `Submit your application, receive competitive offers from banks within ${hours} hours, and choose the best financing option for your business.`;
}

/**
 * Get auction description text
 * @param {string} language - Language code (en/ar)
 * @returns {string} Formatted auction description
 */
export function getAuctionDescription(language = 'en') {
    const hours = auctionConfig.durationHours;
    
    if (language === 'ar') {
        return `تقدم البنوك عروضاً على طلبك خلال فترة المزاد التي تستمر ${hours} ساعة.`;
    }
    
    return `Banks bid on your request and offered deals during the auction period which lasts ${hours} hours.`;
}

/**
 * Get response time text
 * @param {string} language - Language code (en/ar)
 * @returns {string} Formatted response time text
 */
export function getResponseTimeText(language = 'en') {
    const hours = auctionConfig.durationHours;
    
    if (language === 'ar') {
        return `ستتلقى رداً خلال ${hours} ساعة`;
    }
    
    return `You will receive a response within ${hours} hours`;
}

export default {
    getAuctionDurationText,
    getAuctionFAQContent,
    getAuctionDescription,
    getResponseTimeText
};
