/**
 * Numina API Service
 * Centralized API management with authentication and error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = 'https://server-a7od.onrender.com';
const AUTH_TOKEN_KEY = '@numina_auth_token';
const USER_DATA_KEY = '@numina_user_data';

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
    };
  };
  welcomeEmail?: {
    sent: boolean;
    service: string;
    messageId: string;
  };
}

export interface ChatResponse {
  content: string;
  timestamp?: string;
  metadata?: any;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// UBPM Types
export interface UBPMContext {
  userId: string;
  status?: string;
  behavioralContext: {
    communicationStyle: string;
    preferredInteractionMode: string;
    responseTime: string;
    topicPreferences: string[];
    detectedPatterns?: any[];
    confidence?: number;
  };
  personalityContext: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  temporalContext: {
    mostActiveHours: number[];
    preferredSessionLength: number;
    consistencyScore: number;
  };
  emotionalContext?: {
    emotionalPatterns?: any[];
  };
  personalityTraits?: any[];
  confidence: number;
  dataPoints: number;
  lastUpdated: string;
  note?: string;
  dataQuality?: {
    score: number;
    indicators: string[];
    completeness?: number;
    freshness?: number;
  };
}

export interface CollectiveSnapshot {
  id: string;
  timestamp: string;
  sampleSize: number;
  dominantEmotion: string;
  avgIntensity: number;
  insight: string;
  archetype: string;
  status: string;
  timeRange: string;
}

export interface SystemMetrics {
  memory: {
    systemUptime: number;
    totalRequests: number;
    requestsPerHour: number;
    totalTokensSaved: number;
    totalCostSaved: number;
    optimizationStrategies: Record<string, number>;
    activeUsers: number;
    averageSavingsPerRequest: string;
  };
}

// Token management
export const TokenManager = {
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
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
      await AsyncStorage.removeItem(USER_DATA_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  async getUserData(): Promise<any> {
    try {
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  async setUserData(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
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
    console.error('❌ Request interceptor error:', error);
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
    
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    
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
        await TokenManager.removeToken();
        // Navigation to login should be handled by the app
      }
    }

    // Create standardized error with better messaging
    const apiError: ApiError = {
      message: getErrorMessage(error),
      status: error.response?.status,
      code: error.response?.data?.code,
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
      return 'Too many requests. Please wait a moment and try again.';
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
  async signup(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/signup', {
      email,
      password,
    });
    
    // Store token and user data
    await TokenManager.setToken(response.data.token);
    await TokenManager.setUserData(response.data.data.user);
    
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/login', {
      email,
      password,
    });
    
    // Store token and user data
    await TokenManager.setToken(response.data.token);
    await TokenManager.setUserData(response.data.data.user);
    
    return response.data;
  },

  async logout(): Promise<void> {
    await TokenManager.removeToken();
  },

  async refreshToken(): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/refresh');
    await TokenManager.setToken(response.data.token);
    return response.data;
  },
};

// Chat API
export const ChatAPI = {
  async sendMessage(prompt: string, stream: boolean = false): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>('/ai/adaptive-chat', {
      prompt,
      stream,
    });
    
    return response.data;
  },

  async sendAdaptiveMessage(message: string, stream: boolean = false): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>('/personalized-ai/contextual-chat', {
      message,
      stream,
    });
    
    return response.data;
  },

  // Clean streaming implementation optimized for React Native
  async *streamMessage(prompt: string, endpoint: string = '/ai/adaptive-chat'): AsyncGenerator<string, void, unknown> {
    try {
      // Use the clean streaming service
      const { ChatStreaming } = await import('./cleanStreaming');
      
      for await (const chunk of ChatStreaming.streamMessage(prompt, endpoint)) {
        yield chunk;
      }
      
    } catch (error) {
      throw error;
    }
  },

  async *streamAdaptiveMessage(message: string): AsyncGenerator<string, void, unknown> {
    yield* this.streamMessage(message, '/personalized-ai/contextual-chat');
  },
};

// User API
export const UserAPI = {
  async getProfile(): Promise<any> {
    const response = await api.get('/user/profile');
    return response.data;
  },

  async updateProfile(profileData: any): Promise<any> {
    const response = await api.post('/user/profile', profileData);
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

// Analytics API
export const AnalyticsAPI = {
  async getPersonalInsights(): Promise<any> {
    const response = await api.get('/personal-insights/growth-summary');
    return response.data;
  },

  async getEmotionalAnalytics(): Promise<any> {
    const response = await api.get('/emotional-analytics/weekly-report');
    return response.data;
  },

  async getUBPMContext(): Promise<{success: boolean; data: UBPMContext}> {
    const response = await api.get('/test-ubpm/context');
    return response.data;
  },

  async getCollectiveSnapshot(): Promise<{success: boolean; snapshot: CollectiveSnapshot}> {
    const response = await api.get('/collective-snapshots/latest');
    return response.data;
  },

  async getSystemMetrics(): Promise<{data: SystemMetrics}> {
    const response = await api.get('/analytics/system');
    return response.data;
  },

  // NEW: Get real user behavior profile from MongoDB
  async getUserBehaviorProfile(): Promise<any> {
    const response = await api.get('/user/behavior-profile');
    return response.data;
  },

  // NEW: Get collective emotions data (the real chart data)
  async getCollectiveEmotions(): Promise<any> {
    const response = await api.get('/collective-data/emotions');
    return response.data;
  },
};

// Connections API
export const ConnectionsAPI = {
  async findConnections(connectionType: string = 'all'): Promise<any> {
    const response = await api.post('/personalized-ai/find-connections', {
      connectionType,
      limit: 20,
    });
    return response.data;
  },

  async analyzeCompatibility(targetUserId: string): Promise<any> {
    const response = await api.post('/personalized-ai/connection-insights', {
      targetUserId,
    });
    return response.data;
  },

  async getEvents(): Promise<any> {
    const response = await api.get('/cloud/events');
    return response.data;
  },

  async findEventMatches(filters: any): Promise<any> {
    const response = await api.post('/cloud/events/match', filters);
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

  async getConversation(conversationId: string): Promise<any> {
    const response = await api.get(`/conversations/${conversationId}`);
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

  // Deletion Queue API
  async queueConversationDeletion(conversationId: string): Promise<any> {
    const response = await api.post(`/deletion-queue/conversations/${conversationId}`);
    return response.data;
  },

  async queueAllConversationsDeletion(): Promise<any> {
    const response = await api.post('/deletion-queue/conversations/all');
    return response.data;
  },

  async queueUserDataClearance(includeSettings: boolean = true): Promise<any> {
    const response = await api.post('/deletion-queue/user-data', { includeSettings });
    return response.data;
  },

  async getDeletionTaskStatus(taskId: string): Promise<any> {
    const response = await api.get(`/deletion-queue/status/${taskId}`);
    return response.data;
  },

  async getUserDeletionTasks(limit: number = 10): Promise<any> {
    const response = await api.get(`/deletion-queue/tasks?limit=${limit}`);
    return response.data;
  },

  // Retry logic for critical operations
  async withRetry<T>(operation: () => Promise<T>, operationName: string, maxRetries: number = 2): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        console.log(`❌ Attempt ${attempt} failed for ${operationName}:`, error.message);
        
        // Don't retry on authentication errors or client errors (4xx)
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }
        
        // If this was the last attempt, throw the error
        if (attempt === maxRetries + 1) {
          throw new Error(`${operationName} failed after ${maxRetries + 1} attempts: ${error.message}`);
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Retrying ${operationName} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error(`${operationName} failed after maximum retry attempts`);
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