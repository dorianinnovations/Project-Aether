// Application constants and configuration

export const APP_CONFIG = {
  NAME: 'AetherMobile',
  VERSION: '1.0.0',
  API_TIMEOUT: 30000,
  MAX_MESSAGE_LENGTH: 500,
  MAX_ATTACHMENTS: 5,
  CONVERSATION_MESSAGE_LIMIT: 500,
} as const;

export const STORAGE_KEYS = {
  USER_TOKEN: '@aether/user_token',
  THEME: '@aether/theme',
}

// User-specific storage keys to prevent cross-account contamination
export const getUserStorageKeys = (userId?: string) => ({
  USER_DATA: userId ? `@aether/user_data_${userId}` : '@aether/user_data_temp',
  SETTINGS: userId ? `@aether/settings_${userId}` : '@aether/settings_temp',
  CONVERSATIONS: userId ? `@aether/conversations_${userId}` : '@aether/conversations_temp',
  CACHE: userId ? `@aether/cache_${userId}` : '@aether/cache_temp',
  CONVERSATION_CACHE: '@aether/conversation_cache',
});

export const API_ENDPOINTS = {
  AUTH: {
    SIGN_IN: '/auth/signin',
    SIGN_UP: '/auth/signup',
    SIGN_OUT: '/auth/signout',
    REFRESH: '/auth/refresh',
  },
  CHAT: {
    SEND_MESSAGE: '/chat/send',
    STREAM_MESSAGE: '/chat/stream',
    GET_CONVERSATIONS: '/conversations',
    GET_CONVERSATION: '/conversations',
    DELETE_CONVERSATION: '/conversations',
  },
  USER: {
    PROFILE: '/user/profile',
    UPLOAD_AVATAR: '/user/upload-avatar',
    SETTINGS: '/user/settings',
  },
  ANALYTICS: {
    EMOTIONAL_METRICS: '/analytics/emotional-metrics',
    USER_INSIGHTS: '/analytics/user-insights',
  },
  CONNECTIONS: {
    GET_CONNECTIONS: '/connections',
    GET_RECOMMENDATIONS: '/connections/recommendations',
    CONNECT: '/connections/connect',
  },
} as const;

export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 400,
  VERY_SLOW: 600,
} as const;

export const HAPTIC_PATTERNS = {
  LIGHT: 'light',
  MEDIUM: 'medium',
  HEAVY: 'heavy',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const;

export const MESSAGE_TYPES = {
  USER: 'user',
  ASSISTANT: 'numina',
  SYSTEM: 'system',
} as const;

export const SCREEN_NAMES = {
  CHAT: 'Chat',
  PROFILE: 'Profile',
  CONNECTIONS: 'Connections',
  INSIGHTS: 'Insights',
  SIGN_IN: 'SignIn',
  SIGN_UP: 'SignUp',
} as const;