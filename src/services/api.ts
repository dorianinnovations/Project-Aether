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
    
    // Log request for debugging
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    
    // Handle unauthorized - logout user
    if (error.response?.status === 401) {
      await TokenManager.removeToken();
      // You might want to navigate to login screen here
    }

    // Create standardized error
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'Network error',
      status: error.response?.status,
      code: error.response?.data?.code,
    };

    return Promise.reject(apiError);
  }
);

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

  async getUBPMContext(): Promise<any> {
    const response = await api.get('/ubpm/context');
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