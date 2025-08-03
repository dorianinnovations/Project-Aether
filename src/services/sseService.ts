import { TokenManager } from './api';

export interface SSEEvent {
  type: string;
  data: any;
  timestamp: string;
}

export type SSEEventHandler = (event: SSEEvent) => void;

class SSEService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private eventHandlers: Map<string, SSEEventHandler[]> = new Map();
  private isConnecting = false;
  private isManuallyDisconnected = false;

  async connect(): Promise<void> {
    if (this.eventSource || this.isConnecting) {
      return;
    }

    try {
      this.isConnecting = true;
      this.isManuallyDisconnected = false;

      const token = await TokenManager.getToken();
      if (!token) {
        console.error('SSE: No auth token available');
        return;
      }

      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://server-a7od.onrender.com';
      const url = `${baseUrl}/events/stream`;

      // Note: EventSource doesn't support custom headers in React Native
      // We'll need to pass the token as a query parameter for SSE
      const urlWithAuth = `${url}?token=${encodeURIComponent(token)}`;

      this.eventSource = new EventSource(urlWithAuth);

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.isConnecting = false;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data);
          this.handleEvent(data);
        } catch (error) {
          console.error('SSE: Failed to parse event data:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE: Connection error:', error);
        this.isConnecting = false;
        
        if (!this.isManuallyDisconnected) {
          this.handleReconnect();
        }
      };

    } catch (error) {
      console.error('SSE: Failed to connect:', error);
      this.isConnecting = false;
    }
  }

  private handleEvent(event: SSEEvent): void {

    // Handle system events
    if (event.type === 'connected') {
    } else if (event.type === 'heartbeat') {
      // Heartbeat received, connection is alive
      return;
    }

    // Notify registered handlers
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`SSE: Error in handler for ${event.type}:`, error);
      }
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('SSE: Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;

    setTimeout(() => {
      this.disconnect();
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
  }

  disconnect(): void {
    this.isManuallyDisconnected = true;
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.isConnecting = false;
  }

  // Event subscription methods
  on(eventType: string, handler: SSEEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  off(eventType: string, handler: SSEEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Convenience methods for posts events
  onPostCreated(handler: (data: any) => void): void {
    this.on('post:created', (event) => handler(event.data));
  }

  onPostLiked(handler: (data: any) => void): void {
    this.on('post:liked', (event) => handler(event.data));
  }

  onPostShared(handler: (data: any) => void): void {
    this.on('post:shared', (event) => handler(event.data));
  }

  onCommentCreated(handler: (data: any) => void): void {
    this.on('comment:created', (event) => handler(event.data));
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  getConnectionState(): string {
    if (!this.eventSource) return 'disconnected';
    
    switch (this.eventSource.readyState) {
      case EventSource.CONNECTING:
        return 'connecting';
      case EventSource.OPEN:
        return 'connected';
      case EventSource.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }
}

// Export singleton instance
export const sseService = new SSEService();
export default sseService;