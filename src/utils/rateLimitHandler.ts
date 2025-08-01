/**
 * Rate Limit Handler Utility
 * Provides graceful handling of 429 rate limit errors
 */

import { ApiError } from '../services/api';

export interface RateLimitInfo {
  isRateLimit: boolean;
  retryAfter: number;
  message: string;
  userFriendlyMessage: string;
}

export const RateLimitHandler = {
  /**
   * Check if an error is a rate limit error and extract relevant info
   */
  analyze(error: ApiError): RateLimitInfo {
    const isRateLimit = error.isRateLimit || error.status === 429;
    const retryAfter = error.retryAfter || 60;
    
    let userFriendlyMessage = '';
    if (isRateLimit) {
      if (retryAfter < 60) {
        userFriendlyMessage = `Please wait ${retryAfter} seconds before sending another message.`;
      } else if (retryAfter < 3600) {
        const minutes = Math.ceil(retryAfter / 60);
        userFriendlyMessage = `Rate limit reached. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`;
      } else {
        const hours = Math.ceil(retryAfter / 3600);
        userFriendlyMessage = `Rate limit reached. Please wait ${hours} hour${hours > 1 ? 's' : ''} before trying again.`;
      }
    }
    
    return {
      isRateLimit,
      retryAfter,
      message: error.message,
      userFriendlyMessage: userFriendlyMessage || error.message,
    };
  },

  /**
   * Create a user-friendly rate limit message for display
   */
  createMessage(retryAfter: number): string {
    if (retryAfter < 60) {
      return `🚦 Slow down there! Please wait ${retryAfter} seconds before sending another message.`;
    } else if (retryAfter < 3600) {
      const minutes = Math.ceil(retryAfter / 60);
      return `⏰ You've reached your rate limit. Take a ${minutes}-minute break and come back refreshed!`;
    } else {
      const hours = Math.ceil(retryAfter / 3600);
      return `🛑 Rate limit reached. Please wait ${hours} hour${hours > 1 ? 's' : ''} before continuing.`;
    }
  },

  /**
   * Get a suggestion for what the user can do during the wait
   */
  getSuggestion(retryAfter: number): string {
    if (retryAfter < 300) { // Less than 5 minutes
      return "Try reviewing your conversation history or exploring your insights while you wait.";
    } else if (retryAfter < 3600) { // Less than 1 hour
      return "This is a great time to explore your analytics or check out your personality insights!";
    } else {
      return "Consider upgrading to a premium plan for higher rate limits and priority access.";
    }
  },
};

export default RateLimitHandler;