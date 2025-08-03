// Core application types and interfaces

export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'document';
  name: string;
  uri: string;
  size: number;
  width?: number;
  height?: number;
  uploadStatus?: 'pending' | 'uploaded' | 'error';
  mimeType?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'numina' | 'system';
  message: string;
  timestamp: string;
  variant?: 'default' | 'streaming' | 'error' | 'tool';
  metadata?: MessageMetadata;
  attachments?: MessageAttachment[];
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: any;
  result?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface MessageMetadata {
  toolUsed?: string;
  toolCalls?: ToolCall[];
  confidence?: number;
  processingTime?: number;
  searchResults?: boolean;
  query?: string;
  sources?: Array<{
    title: string;
    url: string;
    domain: string;
  }>;
}

export interface Conversation {
  _id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionProfile {
  id: string;
  name: string;
  profilePicture?: string;
  compatibilityScore: number;
  sharedInterests: string[];
  location?: string;
  lastActive: string;
}

export interface EmotionalMetric {
  id: string;
  userId: string;
  emotion: string;
  intensity: number;
  timestamp: string;
  context?: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  colorfulBubblesEnabled: boolean;
  voiceEnabled: boolean;
  language: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  colors: ThemeColors;
  toggleTheme: () => void;
}

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  borders: {
    default: string;
    subtle: string;
  };
}