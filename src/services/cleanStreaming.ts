/**
 * Clean Streaming Implementation for React Native
 * Simple, reliable streaming using XMLHttpRequest
 */

import { TokenManager } from './api';

const API_BASE_URL = 'https://server-a7od.onrender.com';

export interface StreamChunk {
  content: string;
  done: boolean;
}

export async function* streamChatResponse(
  prompt: string,
  endpoint: string = '/ai/adaptive-chat'
): AsyncGenerator<string, void, unknown> {
  const token = await TokenManager.getToken();
  const url = `${API_BASE_URL}${endpoint}`;
  
  const xhr = new XMLHttpRequest();
  let buffer = '';
  let isComplete = false;
  let hasError = false;
  let error: Error | null = null;
  
  // Queue for chunks that arrive
  const chunkQueue: string[] = [];
  let queueResolve: (() => void) | null = null;

  const processStreamData = (data: string) => {
    const lines = data.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        
        if (jsonStr === '[DONE]') {
          isComplete = true;
          if (queueResolve) {
            queueResolve();
            queueResolve = null;
          }
          return;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          
          // Handle different possible response formats
          let content = '';
          if (parsed.content) {
            content = parsed.content;
          } else if (parsed.data && parsed.data.content) {
            content = parsed.data.content;
          } else if (parsed.message) {
            content = parsed.message;
          } else if (parsed.text) {
            content = parsed.text;
          } else if (typeof parsed === 'string') {
            content = parsed;
          }
          
          if (content) {
            chunkQueue.push(content);
            
            // Notify waiting consumer
            if (queueResolve) {
              queueResolve();
              queueResolve = null;
            }
          }
        } catch (e) {
          // Skip malformed JSON
        }
      }
    }
  };

  // Set up the request
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Accept', 'text/event-stream');
  xhr.setRequestHeader('Cache-Control', 'no-cache');
  
  if (token) {
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  }

  xhr.onreadystatechange = () => {
    if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
      if (xhr.status !== 200) {
        error = new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
        hasError = true;
        if (queueResolve) {
          queueResolve();
          queueResolve = null;
        }
        return;
      }
    }

    if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
      const newData = xhr.responseText.slice(buffer.length);
      buffer = xhr.responseText;
      
      if (newData) {
        processStreamData(newData);
      }

      if (xhr.readyState === XMLHttpRequest.DONE) {
        isComplete = true;
        if (queueResolve) {
          queueResolve();
          queueResolve = null;
        }
      }
    }
  };

  xhr.onerror = () => {
    error = new Error('Network error during streaming');
    hasError = true;
    if (queueResolve) {
      queueResolve();
      queueResolve = null;
    }
  };

  xhr.ontimeout = () => {
    error = new Error('Stream timeout');
    hasError = true;
    if (queueResolve) {
      queueResolve();
      queueResolve = null;
    }
  };

  xhr.timeout = 60000; // 60 second timeout

  // Send the request
  const requestData = { prompt, stream: true };
  xhr.send(JSON.stringify(requestData));
  
  // Yield chunks as they arrive
  let processedIndex = 0;
  
  while (!isComplete || processedIndex < chunkQueue.length) {
    if (hasError && error) {
      throw error;
    }
    
    // Process any available chunks
    while (processedIndex < chunkQueue.length) {
      const chunk = chunkQueue[processedIndex++];
      yield chunk;
    }
    
    // If not complete and no more chunks, wait for more
    if (!isComplete && processedIndex >= chunkQueue.length) {
      await new Promise<void>((resolve) => {
        queueResolve = resolve;
        
        // Safety timeout
        setTimeout(() => {
          if (queueResolve === resolve) {
            queueResolve = null;
            resolve();
          }
        }, 5000);
      });
    }
  }
}

// Simple wrapper that matches the existing API
export const ChatStreaming = {
  async *streamMessage(prompt: string, endpoint: string = '/ai/adaptive-chat'): AsyncGenerator<string, void, unknown> {
    yield* streamChatResponse(prompt, endpoint);
  }
};