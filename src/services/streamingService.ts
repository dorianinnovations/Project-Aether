/**
 * React Native Streaming Service for OpenRouter
 * Clean implementation using XMLHttpRequest for proper streaming support
 */

import { TokenManager } from './api';

const API_BASE_URL = 'https://server-a7od.onrender.com';

export interface StreamingOptions {
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

export class StreamingService {
  private static createXHRStream(
    url: string,
    data: any,
    options: StreamingOptions
  ): XMLHttpRequest {
    const xhr = new XMLHttpRequest();
    let buffer = '';
    let processingChunk = false;

    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'text/event-stream');
    xhr.setRequestHeader('Cache-Control', 'no-cache');

    // Handle abort signal
    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        xhr.abort();
      });
    }

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
        if (xhr.status !== 200) {
          const error = new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
          options.onError(error);
          return;
        }
      }

      if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
        if (processingChunk) return;
        processingChunk = true;

        try {
          const newData = xhr.responseText.slice(buffer.length);
          buffer = xhr.responseText;

          if (newData) {
            this.processSSEData(newData, options);
          }

          if (xhr.readyState === XMLHttpRequest.DONE) {
            options.onComplete();
          }
        } catch (error) {
          options.onError(error as Error);
        } finally {
          processingChunk = false;
        }
      }
    };

    xhr.onerror = () => {
      options.onError(new Error('Network error occurred'));
    };

    xhr.ontimeout = () => {
      options.onError(new Error('Request timed out'));
    };

    // Set timeout to 60 seconds
    xhr.timeout = 60000;

    return xhr;
  }

  private static processSSEData(data: string, options: StreamingOptions) {
    const lines = data.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonData = line.slice(6).trim();
        
        if (jsonData === '[DONE]') {
          return;
        }

        try {
          const parsed = JSON.parse(jsonData);
          if (parsed.content) {
            options.onChunk(parsed.content);
          }
        } catch (e) {
          // Skip malformed JSON - this is normal for streaming
          console.debug('Skipped malformed SSE data:', jsonData.substring(0, 50));
        }
      }
    }
  }

  static async streamChat(
    prompt: string,
    endpoint: string = '/ai/adaptive-chat',
    options: StreamingOptions
  ): Promise<void> {
    const token = await TokenManager.getToken();
    const url = `${API_BASE_URL}${endpoint}`;
    
    const requestData = {
      prompt,
      stream: true,
    };

    const xhr = this.createXHRStream(url, requestData, options);
    
    // Add auth header if token exists
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    // Send the request
    xhr.send(JSON.stringify(requestData));
  }
}

// Alternative implementation using fetch with manual polling for React Native compatibility
export class FetchStreamingService {
  private static async *createFetchStream(
    url: string,
    data: any,
    signal?: AbortSignal
  ): AsyncGenerator<string, void, unknown> {
    const token = await TokenManager.getToken();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Try to use ReadableStream if available
    if (response.body && response.body.getReader) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonData = line.slice(6).trim();
              
              if (jsonData === '[DONE]') {
                return;
              }

              try {
                const parsed = JSON.parse(jsonData);
                if (parsed.content) {
                  yield parsed.content;
                }
              } catch (e) {
                console.debug('Skipped malformed SSE data');
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } else {
      // Fallback: Use polling approach for React Native
      yield* this.pollForResponse(url, data, signal);
    }
  }

  private static async *pollForResponse(
    url: string,
    data: any,
    signal?: AbortSignal
  ): AsyncGenerator<string, void, unknown> {
    // This is a simplified polling approach - not true streaming
    // But provides immediate feedback while maintaining compatibility
    const token = await TokenManager.getToken();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({ ...data, stream: false }), // Disable server-side streaming
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.content) {
      // Simulate streaming by yielding character by character with delays
      const text = result.content;
      for (let i = 0; i < text.length; i++) {
        if (signal?.aborted) break;
        
        yield text[i];
        
        // Add small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    }
  }

  static async *streamChat(
    prompt: string,
    endpoint: string = '/ai/adaptive-chat',
    signal?: AbortSignal
  ): AsyncGenerator<string, void, unknown> {
    const url = `${API_BASE_URL}${endpoint}`;
    const data = { prompt, stream: true };

    yield* this.createFetchStream(url, data, signal);
  }
}

export default StreamingService;