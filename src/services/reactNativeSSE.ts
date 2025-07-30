/**
 * React Native Server-Sent Events (SSE) Implementation
 * Clean, robust streaming solution for OpenRouter chat
 */

import { TokenManager } from './api';

const API_BASE_URL = 'https://server-a7od.onrender.com';

export interface SSEOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
  signal?: AbortSignal;
}

export class ReactNativeSSE {
  private xhr: XMLHttpRequest | null = null;
  private url: string;
  private options: SSEOptions;
  private onMessage: (data: string) => void;
  private onError: (error: Error) => void;
  private onClose: () => void;
  private buffer = '';

  constructor(
    url: string,
    options: SSEOptions,
    callbacks: {
      onMessage: (data: string) => void;
      onError: (error: Error) => void;
      onClose: () => void;
    }
  ) {
    this.url = url;
    this.options = options;
    this.onMessage = callbacks.onMessage;
    this.onError = callbacks.onError;
    this.onClose = callbacks.onClose;
  }

  async connect(): Promise<void> {
    const token = await TokenManager.getToken();
    
    this.xhr = new XMLHttpRequest();
    
    // Handle abort signal
    if (this.options.signal) {
      this.options.signal.addEventListener('abort', () => {
        this.close();
      });
    }

    this.xhr.open(this.options.method || 'POST', this.url, true);
    
    // Set headers
    this.xhr.setRequestHeader('Accept', 'text/event-stream');
    this.xhr.setRequestHeader('Cache-Control', 'no-cache');
    
    if (this.options.method === 'POST') {
      this.xhr.setRequestHeader('Content-Type', 'application/json');
    }
    
    if (token) {
      this.xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    
    if (this.options.headers) {
      Object.entries(this.options.headers).forEach(([key, value]) => {
        this.xhr!.setRequestHeader(key, value);
      });
    }

    // Set up event handlers
    this.xhr.onreadystatechange = () => {
      if (!this.xhr) return;

      if (this.xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
        if (this.xhr.status !== 200) {
          this.onError(new Error(`HTTP ${this.xhr.status}: ${this.xhr.statusText}`));
          return;
        }
      }

      if (this.xhr.readyState === XMLHttpRequest.LOADING || this.xhr.readyState === XMLHttpRequest.DONE) {
        const newData = this.xhr.responseText.slice(this.buffer.length);
        this.buffer = this.xhr.responseText;
        
        if (newData) {
          this.processData(newData);
        }

        if (this.xhr.readyState === XMLHttpRequest.DONE) {
          this.onClose();
        }
      }
    };

    this.xhr.onerror = () => {
      this.onError(new Error('Network error'));
    };

    this.xhr.ontimeout = () => {
      this.onError(new Error('Request timeout'));
    };

    // Set timeout
    this.xhr.timeout = 60000;

    // Send request
    if (this.options.body) {
      this.xhr.send(JSON.stringify(this.options.body));
    } else {
      this.xhr.send();
    }
  }

  private processData(data: string): void {
    const lines = data.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const content = line.slice(6);
        
        if (content.trim() === '[DONE]') {
          this.onClose();
          return;
        }

        try {
          const parsed = JSON.parse(content);
          if (parsed.content) {
            this.onMessage(parsed.content);
          }
        } catch (e) {
          // Skip invalid JSON - normal in streaming
          console.debug('Skipped invalid JSON in SSE stream');
        }
      }
    }
  }

  close(): void {
    if (this.xhr) {
      this.xhr.abort();
      this.xhr = null;
    }
  }
}

// Utility function for streaming chat
export async function streamChatMessage(
  prompt: string,
  endpoint: string = '/ai/adaptive-chat'
): Promise<AsyncGenerator<string, void, unknown>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  
  const chunks: string[] = [];
  let resolve: ((value: IteratorResult<string, void>) => void) | null = null;
  let reject: ((error: Error) => void) | null = null;
  let done = false;
  let error: Error | null = null;

  const sse = new ReactNativeSSE(
    url,
    {
      method: 'POST',
      body: { prompt, stream: true },
      signal: controller.signal,
    },
    {
      onMessage: (chunk: string) => {
        chunks.push(chunk);
        if (resolve) {
          resolve({ value: chunk, done: false });
          resolve = null;
        }
      },
      onError: (err: Error) => {
        error = err;
        done = true;
        if (reject) {
          reject(err);
          reject = null;
        }
      },
      onClose: () => {
        done = true;
        if (resolve) {
          resolve({ value: undefined, done: true });
          resolve = null as any;
        }
      },
    }
  );

  // Start the connection
  await sse.connect();

  // Return async generator
  return (async function* () {
    let index = 0;
    
    while (!done || index < chunks.length) {
      if (index < chunks.length) {
        yield chunks[index++];
      } else if (!done) {
        // Wait for next chunk
        try {
          const result = await new Promise<IteratorResult<string, void>>((res, rej) => {
            resolve = res;
            reject = rej;
            
            // Timeout to prevent hanging
            setTimeout(() => {
              if (resolve !== null) {
                rej(new Error('Stream timeout'));
              }
            }, 5000);
          });
          
          if (result.done) {
            break;
          }
          
          yield result.value;
          index++;
        } catch (err) {
          sse.close();
          throw err;
        }
      } else {
        break;
      }
    }
    
    sse.close();
    
    if (error) {
      throw error;
    }
  })();
}