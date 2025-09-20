/**
 * Translation utilities for dynamic text replacement
 * This allows us to use configuration values in translated text
 */

import { auctionConfig } from './config/auction-config.js';

/**
 * Replace placeholders in translation strings with actual configuration values
 * @param {string} text - The text with placeholders
 * @returns {string} - The text with placeholders replaced
 */
export function replaceConfigPlaceholders(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  return text
    .replace(/\{AUCTION_HOURS\}/g, auctionConfig.durationHours)
    .replace(/\{AUCTION_DURATION\}/g, `${auctionConfig.durationHours} hours`)
    .replace(/48 hours/g, `${auctionConfig.durationHours} hours`)
    .replace(/within 48 hours/g, `within ${auctionConfig.durationHours} hours`)
    .replace(/after 48 hours/g, `after ${auctionConfig.durationHours} hours`)
    .replace(/48-hour/g, `${auctionConfig.durationHours}-hour`);
}

/**
 * Get translated text with configuration placeholders replaced
 * @param {string} key - Translation key
 * @param {Object} translations - Translation object
 * @returns {string} - Translated text with placeholders replaced
 */
export function getTranslatedText(key, translations) {
  const text = translations[key];
  return replaceConfigPlaceholders(text);
}

/**
 * Process an entire translation object to replace placeholders
 * @param {Object} translations - Translation object
 * @returns {Object} - Translation object with placeholders replaced
 */
export function processTranslations(translations) {
  const processed = {};
  
  for (const [key, value] of Object.entries(translations)) {
    if (typeof value === 'string') {
      processed[key] = replaceConfigPlaceholders(value);
    } else {
      processed[key] = value;
    }
  }
  
  return processed;
}
