/**
 * Numina API Service
 * Centralized API management with authentication and error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageCleanup } from '../utils/storageCleanup';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
const AUTH_TOKEN_KEY = '@numina_auth_token';

// User-specific storage keys to prevent cross-account contamination
const getStorageKeys = (userId?: string) => ({
  USER_DATA: userId ? `@numina_user_data_${userId}` : '@numina_user_data_temp',
  CONVERSATIONS: userId ? `@numina_conversations_${userId}` : '@numina_conversations_temp',
  SETTINGS: userId ? `@numina_settings_${userId}` : '@numina_settings_temp',
  CACHE: userId ? `@numina_cache_${userId}` : '@numina_cache_temp'
});

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface AuthResponse {
  status: string;
  token: string;
  data: {
    user: {
      id: string;
      email: string;
      name?: string;
    };
  };
  welcomeEmail?: {
    sent: boolean;
    service: string;
    messageId: string;
  };
}

export interface ChatResponse {
  success: boolean;
  data: {
    response: string;
    tone?: string;
    hasMemory?: boolean;
    hasTools?: boolean;
    toolsUsed?: number;
    toolResults?: Array<{
      tool: string;
      query?: string;
      type?: string;
      success: boolean;
      data?: any;
      tier?: string;
      processingTime?: number;
    }>;
    tier?: string;
    responseTime?: number;
    cognitiveEngineUsed?: boolean;
    content?: string; // Added for vision API compatibility
  };
  // Legacy support for old format
  content?: string;
  response?: string; // Added for direct response format
  timestamp?: string;
  metadata?: any;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  isRateLimit?: boolean;
  retryAfter?: number;
}



// Token management
export const TokenManager = {
  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getToken();
      return !!token;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  },

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      // Get current user data to find user ID for cleanup
      const currentUser = await this.getUserData();
      const userId = currentUser?.id;
      
      // Remove user-specific data if we have a user ID
      if (userId) {
        const keys = getStorageKeys(userId);
        await Promise.all([
          AsyncStorage.removeItem(keys.USER_DATA),
          AsyncStorage.removeItem(keys.CONVERSATIONS),
          AsyncStorage.removeItem(keys.SETTINGS),
          AsyncStorage.removeItem(keys.CACHE)
        ]);
      }
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  async getUserData(): Promise<any> {
    try {
      // Try to find user-specific storage first
      const allKeys = await AsyncStorage.getAllKeys();
      const userDataKey = allKeys.find(key => key.includes('@numina_user_data_') && !key.includes('_temp'));
      
      if (userDataKey) {
        const userData = await AsyncStorage.getItem(userDataKey);
        return userData ? JSON.parse(userData) : null;
      }
      
      // Fallback to temp storage
      const tempKeys = getStorageKeys();
      const userData = await AsyncStorage.getItem(tempKeys.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  async setUserData(userData: any): Promise<void> {
    try {
      const userId = userData?.id;
      const keys = getStorageKeys(userId);
      
      // Store in user-specific location
      await AsyncStorage.setItem(keys.USER_DATA, JSON.stringify(userData));
      
      // Clean up any temp storage
      if (userId) {
        const tempKeys = getStorageKeys();
        await AsyncStorage.removeItem(tempKeys.USER_DATA);
      }
    } catch (error) {
      console.error('Error setting user data:', error);
    }
  },
};

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config: any) => {
    const token = await TokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Request logging can be enabled for debugging if needed
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors with retry logic
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error('API Error:', error.response?.status, error.response?.data);
    
    // Handle unauthorized - attempt token refresh first
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshedAuth = await AuthAPI.refreshToken();
        if (refreshedAuth.token) {
          originalRequest.headers.Authorization = `Bearer ${refreshedAuth.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Only remove token if this is a critical endpoint, not for optional requests
        if (!originalRequest.url?.includes('/conversations') && !originalRequest.url?.includes('/socket.io')) {
          await TokenManager.removeToken();
        }
        // Navigation to login should be handled by the app
      }
    }

    // Create standardized error with better messaging
    const apiError: ApiError = {
      message: getErrorMessage(error),
      status: error.response?.status,
      code: error.response?.data?.code,
      isRateLimit: error.response?.status === 429,
      retryAfter: error.response?.status === 429 ? 
        parseInt(error.response?.headers?.['retry-after'] || '60') : undefined,
    };

    return Promise.reject(apiError);
  }
);

// Helper function for better error messages
function getErrorMessage(error: any): string {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return 'Request timed out. Please check your internet connection and try again.';
  }
  
  if (error.code === 'NETWORK_ERROR' || !error.response) {
    return 'Network error. Please check your internet connection.';
  }
  
  switch (error.response?.status) {
    case 400:
      return 'Invalid request. Please try again.';
    case 401:
      return 'Authentication failed. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'Resource not found.';
    case 429:
      // Get retry-after header if available (in seconds)
      const retryAfter = error.response?.headers?.['retry-after'];
      const waitTime = retryAfter ? parseInt(retryAfter) : 60;
      return `Rate limit reached. Please wait ${waitTime} seconds before trying again.`;
    case 500:
      return 'Server error. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
}

// Authentication API
export const AuthAPI = {
  async signup(email: string, password: string, name?: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/signup', {
      email,
      password,
      ...(name && { name }),
    });
    
    // Store token and user data with cleanup
    await TokenManager.setToken(response.data.token);
    await TokenManager.setUserData(response.data.data.user);
    
    // Clean up any contaminated storage for this user
    if (response.data.data.user?.id) {
      await StorageCleanup.cleanupUserStorage(response.data.data.user.id);
    }
    
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/login', {
      email,
      password,
    });
    
    // Store token and user data with cleanup
    await TokenManager.setToken(response.data.token);
    await TokenManager.setUserData(response.data.data.user);
    
    // Clean up any contaminated storage for this user
    if (response.data.data.user?.id) {
      await StorageCleanup.cleanupUserStorage(response.data.data.user.id);
    }
    
    return response.data;
  },

  async logout(): Promise<void> {
    await TokenManager.removeToken();
  },

  async refreshToken(): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/refresh');
    await TokenManager.setToken(response.data.token);
    return response.data;
  },
};

// Chat API
export const ChatAPI = {
  // Legacy method kept for compatibility - but streaming is the only supported mode
  async sendMessage(prompt: string, stream: boolean = true, attachments?: any[]): Promise<ChatResponse> {
    // Note: This is only used for photo fallback in StreamEngine
    // All regular chat uses streaming via streamMessageWords
    
    if (attachments && attachments.length > 0) {
      const formData = new FormData();
      formData.append('message', prompt);
      formData.append('stream', 'false'); // Force non-streaming for attachments (required for vision)
      
      attachments.forEach((attachment, index) => {
        if (attachment.type === 'image') {
          const imageFile = {
            uri: attachment.uri,
            type: attachment.mimeType || 'image/jpeg',
            name: attachment.name || `image_${index}.jpg`,
          } as any;
          
          formData.append('files', imageFile);
        } else if (attachment.type === 'document') {
          const docFile = {
            uri: attachment.uri,
            type: attachment.mimeType || 'application/octet-stream',
            name: attachment.name || `document_${index}`,
          } as any;
          
          formData.append('files', docFile);
        }
      });
      
      const response = await api.post<ChatResponse>('/ai/adaptive-chat', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      
      // Normalize response format for photo responses
      if (response.data.success && response.data.data) {
        return {
          ...response.data,
          content: response.data.data.response,
          metadata: {
            toolResults: response.data.data.toolResults,
            tier: response.data.data.tier,
            responseTime: response.data.data.responseTime,
          }
        };
      }
      
      // Handle different response formats from vision API
      let content = '';
      let metadata: any = {};
      
      // Check various possible response structures
      if (response.data.success && response.data.data && response.data.data.response) {
        content = response.data.data.response;
        metadata = response.data.data;
      } else if (response.data.content) {
        content = response.data.content;
        metadata = response.data;
      } else if (response.data.response) {
        content = response.data.response;
        metadata = response.data;
      } else if (response.data.data && response.data.data.content) {
        content = response.data.data.content;
        metadata = response.data.data;
      } else if (typeof response.data === 'string') {
        content = response.data;
      }
      
      if (content) {
        return {
          success: true,
          content: content,
          data: {
            response: content,
            tier: (metadata as any)?.tier || 'vision',
            responseTime: (metadata as any)?.responseTime || 0,
            toolResults: (metadata as any)?.toolResults,
          },
          metadata: metadata
        };
      }
      
      // If we still don't have content, log the full response for debugging
      console.error('Unable to extract content from vision API response:', response.data);
      return response.data;
    }
    
    throw new Error('Non-streaming text messages not supported. Use streamMessageWords instead.');
  },


  // Fresh streaming implementation (stable)
  async *streamMessage(prompt: string, endpoint: string = '/ai/adaptive-chat', attachments?: any[]): AsyncGenerator<string, void, unknown> {
    const { StreamingService } = await import('./streaming');
    yield* StreamingService.streamChat(prompt, endpoint, attachments);
  },

  // StreamEngine - Proprietary word-based streaming
  async *streamMessageWords(prompt: string, endpoint: string = '/ai/adaptive-chat', attachments?: any[]): AsyncGenerator<string | { text: string; metadata?: any }, void, unknown> {
    const { StreamEngine } = await import('./StreamEngine');
    yield* StreamEngine.streamChat(prompt, endpoint, attachments);
  },

};

// User API
export const UserAPI = {
  async getProfile(): Promise<any> {
    const response = await api.get('/profile');
    return response.data;
  },

  async updateProfile(profileData: any): Promise<any> {
    const response = await api.post('/user/profile', profileData);
    return response.data;
  },

  async uploadProfilePicture(imageUri: string): Promise<any> {
    const formData = new FormData();
    
    // Create file object for React Native
    const imageFile = {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile-picture.jpg',
    } as any;
    
    formData.append('profilePicture', imageFile);

    const response = await api.post('/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteProfilePicture(): Promise<any> {
    const response = await api.delete('/profile/picture');
    return response.data;
  },

  async uploadBannerImage(imageUri: string): Promise<any> {
    const formData = new FormData();
    
    // Create file object for React Native
    const imageFile = {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'banner-image.jpg',
    } as any;
    
    formData.append('bannerImage', imageFile);

    const response = await api.post('/profile/banner', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteBannerImage(): Promise<any> {
    const response = await api.delete('/profile/banner');
    return response.data;
  },

  async getSettings(): Promise<any> {
    const response = await api.get('/user/settings');
    return response.data;
  },

  async updateSettings(settings: any): Promise<any> {
    const response = await api.post('/user/settings', settings);
    return response.data;
  },
};



// Conversation API
export const ConversationAPI = {
  async getRecentConversations(limit: number = 20): Promise<any> {
    const response = await api.get(`/conversations/recent?limit=${limit}`);
    return {
      conversations: response.data.data || [],
      total: response.data.total || 0
    };
  },

  async getConversation(conversationId: string, messageLimit?: number): Promise<any> {
    // Use messageLimit parameter as expected by server (max 500)
    const limit = Math.min(messageLimit || 500, 500); // Respect server max of 500
    const params = `?messageLimit=${limit}`;
    const response = await api.get(`/conversations/${conversationId}${params}`);
    return response.data.data;
  },

  async createConversation(title?: string): Promise<any> {
    const response = await api.post('/conversations', { title });
    return response.data;
  },

  async syncConversations(lastSyncTimestamp?: string): Promise<any> {
    const response = await api.post('/conversations/sync', { lastSyncTimestamp });
    return response.data;
  },

  async addMessageToConversation(conversationId: string, message: any): Promise<any> {
    const response = await api.post(`/conversations/${conversationId}/messages`, message);
    return response.data;
  },

  async searchConversations(query: string, limit: number = 10): Promise<any> {
    const response = await api.get(`/conversations?search=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  async deleteConversation(conversationId: string): Promise<any> {
    const response = await api.delete(`/conversations/${conversationId}`);
    return response.data;
  },

  async deleteAllConversations(): Promise<any> {
    const response = await api.delete('/conversations/all');
    return response.data;
  },


};

// Health check
export const HealthAPI = {
  async checkHealth(): Promise<any> {
    const response = await api.get('/');
    return response.data;
  },
};

// Export the configured axios instance for custom requests
export { api };

// Export utility functions
export const ApiUtils = {
  isNetworkError: (error: any): boolean => {
    return !error.response && error.request;
  },

  isServerError: (error: any): boolean => {
    return error.response && error.response.status >= 500;
  },

  isClientError: (error: any): boolean => {
    return error.response && error.response.status >= 400 && error.response.status < 500;
  },

  getErrorMessage: (error: any): string => {
    if (error.message) return error.message;
    if (error.response?.data?.message) return error.response.data.message;
    if (error.request) return 'Network error - please check your connection';
    return 'An unexpected error occurred';
  },
};

export default api;