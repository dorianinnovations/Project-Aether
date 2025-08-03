import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WebSocketEvents {
  // Connection events
  connected: (data: { userId: string; timestamp: Date; message: string }) => void;
  
  // Post events
  'post:created': (data: { post: any; userId: string }) => void;
  'post:updated': (data: { post: any; userId: string }) => void;
  'post:deleted': (data: { postId: string; userId: string }) => void;
  
  // Comment events
  'comment:created': (data: { postId: string; comment: any; userId: string }) => void;
  'comment:deleted': (data: { postId: string; commentId: string; userId: string }) => void;
  
  // Engagement events
  'post_reaction_update': (data: { postId: string; userId: string; reactionType: string; action: string }) => void;
  'new_comment_notification': (data: { postId: string; commenterId: string; commentContent: string }) => void;
  'post_view_update': (data: { postId: string; viewerCount: number }) => void;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners: Map<keyof WebSocketEvents, Function[]> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isAuthenticatedUser = false;

  async connect(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('@numina_auth_token');
      if (!token) {
        console.warn('No authentication token found, skipping WebSocket connection');
        this.isAuthenticatedUser = false;
        return; // Don't throw error, just skip connection
      }

      this.isAuthenticatedUser = true;

      // First, let's try to establish connection via polling to get the session ID
      const pollUrl = `https://server-a7od.onrender.com/socket.io/?EIO=4&transport=polling`;
      
      try {
        // Try to get session ID from polling endpoint
        const pollResponse = await fetch(pollUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!pollResponse.ok) {
          throw new Error(`HTTP ${pollResponse.status}: ${pollResponse.statusText}`);
        }
        
        const pollData = await pollResponse.text();
        
        // Extract session ID from the response (format: "97:0{"sid":"...","upgrades":["websocket"]...}")
        const sidMatch = pollData.match(/"sid":"([^"]+)"/);
        const sessionId = sidMatch ? sidMatch[1] : null;
        
        if (!sessionId) {
          throw new Error('Could not extract session ID from polling response');
        }
        
        // Now connect via WebSocket with the session ID
        const serverUrl = `wss://server-a7od.onrender.com/socket.io/?EIO=4&transport=websocket&sid=${sessionId}`;
        this.ws = new WebSocket(serverUrl);
        this.setupEventHandlers();
      } catch (pollError) {
        console.error('Failed to establish Socket.IO handshake:', pollError);
        const errorMessage = pollError instanceof Error ? pollError.message : String(pollError);
        throw new Error('Socket.IO handshake failed: ' + errorMessage);
      }
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        const onOpen = () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Send auth message if token available
          if (token) {
            this.send('auth', { token });
          }
          
          resolve();
        };

        const onError = (error: Event) => {
          clearTimeout(timeout);
          console.error('WebSocket connection error:', error);
          reject(error);
        };

        this.ws!.addEventListener('open', onOpen, { once: true });
        this.ws!.addEventListener('error', onError, { once: true });
      });
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.addEventListener('open', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Join global posts room
      this.send('join_community', { community: 'global' });
    });

    this.ws.addEventListener('close', (event) => {
      this.isConnected = false;
      this.attemptReconnect();
    });

    this.ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.ws.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });
  }

  private handleMessage(message: any): void {
    // Handle Socket.IO message format
    if (Array.isArray(message) && message.length >= 2) {
      const [eventName, ...eventData] = message;
      const data = eventData.length === 1 ? eventData[0] : eventData;
      
      switch (eventName) {
        case 'post:created':
          this.emitToListeners('post:created', data);
          break;
        case 'post:updated':
          this.emitToListeners('post:updated', data);
          break;
        case 'post:deleted':
          this.emitToListeners('post:deleted', data);
          break;
        case 'comment:created':
          this.emitToListeners('comment:created', data);
          break;
        case 'comment:deleted':
          this.emitToListeners('comment:deleted', data);
          break;
        case 'post_reaction_update':
          this.emitToListeners('post_reaction_update', data);
          break;
        case 'new_comment_notification':
          this.emitToListeners('new_comment_notification', data);
          break;
        case 'post_view_update':
          this.emitToListeners('post_view_update', data);
          break;
        case 'connected':
          this.emitToListeners('connected', data);
          break;
        default:
      }
    } else {
      // Handle regular JSON message format
      const { type, data } = message;
      
      switch (type) {
        case 'post:created':
          this.emitToListeners('post:created', data);
          break;
        case 'post:updated':
          this.emitToListeners('post:updated', data);
          break;
        case 'post:deleted':
          this.emitToListeners('post:deleted', data);
          break;
        case 'comment:created':
          this.emitToListeners('comment:created', data);
          break;
        case 'comment:deleted':
          this.emitToListeners('comment:deleted', data);
          break;
        case 'post_reaction_update':
          this.emitToListeners('post_reaction_update', data);
          break;
        case 'new_comment_notification':
          this.emitToListeners('new_comment_notification', data);
          break;
        case 'post_view_update':
          this.emitToListeners('post_view_update', data);
          break;
        case 'connected':
          this.emitToListeners('connected', data);
          break;
        default:
      }
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 5000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(() => {
        // Reconnection failed, will try again
      });
    }, delay);
  }

  private send(type: string, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Send in Socket.IO format [eventName, data]
      this.ws.send(JSON.stringify([type, data]));
    }
  }

  private emitToListeners<T extends keyof WebSocketEvents>(event: T, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in WebSocket event listener for ${event}:`, error);
      }
    });
  }

  on<T extends keyof WebSocketEvents>(event: T, listener: WebSocketEvents[T]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener as Function);
  }

  off<T extends keyof WebSocketEvents>(event: T, listener: WebSocketEvents[T]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener as Function);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Post-specific methods
  joinCommunity(community: string): void {
    this.send('join_community', { community });
  }

  leaveCommunity(community: string): void {
    this.send('leave_community', { community });
  }

  joinPost(postId: string): void {
    this.send('join_post', { postId });
  }

  leavePost(postId: string): void {
    this.send('leave_post', { postId });
  }

  viewPost(postId: string): void {
    this.send('view_post', { postId });
  }

  reactToPost(postId: string, reactionType: string, action: 'add' | 'remove'): void {
    this.send('post_reaction', { postId, reactionType, action });
  }

  notifyComment(postId: string, postAuthorId: string, commentContent: string): void {
    this.send('comment_notification', { postId, postAuthorId, commentContent });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedUser;
  }

  // Safe connect method that only attempts connection for authenticated users
  async safeConnect(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('@numina_auth_token');
      if (token) {
        await this.connect();
      } else {
      }
    } catch (error) {
      console.warn('Safe WebSocket connection failed:', error);
      // Don't throw - app should continue working without WebSocket
    }
  }
}

// Export singleton instance
export const websocketClient = new WebSocketClient();