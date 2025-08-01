/**
 * Dynamic Placeholder Messages Utility
 * Provides randomized placeholder text for various input components
 */

export const chatPlaceholders = [
  "Ask Numina anything...",
  "What's on your mind?",
  "Share your thoughts...",
  "Need help with something?",
  "Let's explore together...",
  "What would you like to know?",
  "Start a conversation...",
  "How can I assist you?",
  "Tell me what you're thinking...",
  "Ask me anything...",
  "What brings you here today?",
  "Ready to chat?",
  "What's your question?",
  "Let's dive in...",
  "Curious about something?",
];

export const connectionPlaceholders = [
  "What's on your mind?",
  "Share your thoughts...",
  "Start a discussion...",
  "What's happening?",
  "Tell your story...",
  "Share something interesting...",
  "What's new with you?",
  "Express yourself...",
  "Start the conversation...",
  "What would you like to share?",
];

export const detailPlaceholders = [
  "Share more details, ask questions, or start a discussion...",
  "Add context, ask follow-ups, or continue the conversation...",
  "Elaborate on your thoughts or ask related questions...",
  "Provide more information or explore further...",
  "Expand on this topic or ask for clarification...",
  "Share additional insights or pose new questions...",
];

export const searchPlaceholders = [
  "Search...",
  "Find something...",
  "Look for...",
  "Explore...",
  "Discover...",
];

/**
 * Get a random placeholder from the specified array
 */
export const getRandomPlaceholder = (placeholders: string[]): string => {
  const randomIndex = Math.floor(Math.random() * placeholders.length);
  return placeholders[randomIndex];
};

/**
 * Get a random chat placeholder
 */
export const getRandomChatPlaceholder = (): string => {
  return getRandomPlaceholder(chatPlaceholders);
};

/**
 * Get a random connection placeholder
 */
export const getRandomConnectionPlaceholder = (): string => {
  return getRandomPlaceholder(connectionPlaceholders);
};

/**
 * Get a random detail placeholder
 */
export const getRandomDetailPlaceholder = (): string => {
  return getRandomPlaceholder(detailPlaceholders);
};

/**
 * Get a random search placeholder
 */
export const getRandomSearchPlaceholder = (): string => {
  return getRandomPlaceholder(searchPlaceholders);
};