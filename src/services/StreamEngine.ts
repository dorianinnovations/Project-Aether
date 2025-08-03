/**
 * StreamEngine - Proprietary Intelligent Streaming System
 * Word-based streaming with real-time processing
 * Backend sends: data: {"content":"text","tier":"core","cognitiveEngineActive":true}
 * Backend ends with: data: [DONE]
 */

import { TokenManager } from './api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export interface StreamChunk {
  text: string;
  metadata?: any;
}

export class StreamEngine {
  /**
   * React Native compatible streaming that yields complete words for animation
   */
  static async *streamChat(
    prompt: string,
    endpoint: string = '/ai/adaptive-chat',
    attachments?: any[]
  ): AsyncGenerator<string | StreamChunk, void, unknown> {
    
    // For attachments, fall back to non-streaming (as per backend)
    if (attachments && attachments.length > 0) {
      try {
        const { ChatAPI } = await import('./api');
        const response = await ChatAPI.sendMessage(prompt, false, attachments);
        
        // Extract content from various response formats
        const content = response.content || 
                       response.data?.response || 
                       response.data?.content ||
                       response.response || 
                       '';
        
        if (!content || content.trim() === '') {
          // Log response for debugging
          console.warn('Empty vision response:', JSON.stringify(response, null, 2));
          yield 'I received your image but the vision analysis returned an empty response. Please try sending the image again or check if the image is clear and properly formatted.';
          return;
        }
        
        // Split response into words for consistent behavior with streaming
        const words = content.split(/(\s+)/);
        for (const word of words) {
          if (word.trim()) {
            yield word;
            await new Promise(resolve => setTimeout(resolve, 80)); // Slightly faster for better UX
          }
        }
        
        // Yield metadata if available from various response structures
        const responseMetadata = response.metadata || 
                                (response.data as any)?.metadata ||
                                (response.data as any)?.toolResults ||
                                (response.data as any)?.data?.toolResults;
        if (responseMetadata) {
          yield { text: '', metadata: responseMetadata };
        }
        return;
        
      } catch (error) {
        console.error('Vision API error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        yield `I encountered an error while processing your image: ${errorMessage}. Please try again.`;
        return;
      }
    }
    
    const token = await TokenManager.getToken();
    const url = `${API_BASE_URL}${endpoint}`;
    
    const chunks: string[] = [];
    let completed = false;
    let buffer = '';
    let processedChunks = 0;
    let accumulatedText = '';
    let lastWordBoundary = 0;
    let currentMetadata: any = null;
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'text/event-stream');
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
        const newData = xhr.responseText.slice(buffer.length);
        buffer = xhr.responseText;
        
        if (newData) {
          const lines = newData.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              
              if (data === '[DONE]') {
                completed = true;
                continue;
              }
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  chunks.push(parsed.content);
                }
                // Capture metadata if present
                if (parsed.metadata) {
                  currentMetadata = parsed.metadata;
                }
              } catch (e) {
                console.warn('Streaming parse error:', e);
              }
            }
          }
        }
        
        if (xhr.readyState === XMLHttpRequest.DONE) {
          completed = true;
        }
      }
    };
    
    xhr.onerror = () => {
      completed = true;
    };
    
    xhr.ontimeout = () => {
      completed = true;
    };
    
    xhr.timeout = 30000;
    xhr.send(JSON.stringify({ prompt, stream: true }));
    
    // Process chunks and yield complete words
    while (!completed || processedChunks < chunks.length) {
      if (processedChunks < chunks.length) {
        const chunk = chunks[processedChunks++];
        accumulatedText += chunk;
        
        // Find word boundaries and yield complete words
        const words = accumulatedText.slice(lastWordBoundary).split(/(\s+)/);
        
        // Yield all complete words except the last one (might be incomplete)
        for (let i = 0; i < words.length - 1; i++) {
          const word = words[i];
          if (word.trim()) { // Only yield non-whitespace words
            yield word;
            await new Promise(resolve => setTimeout(resolve, 5)); // Lightning-fast streaming
          }
        }
        
        // Update the last word boundary
        if (words.length > 1) {
          const processedLength = words.slice(0, -1).join('').length;
          lastWordBoundary += processedLength;
        }
        
      } else {
        // Wait for more chunks
        await new Promise(resolve => setTimeout(resolve, 10)); // Ultra-fast polling
      }
    }
    
    // Yield any remaining text
    const remainingText = accumulatedText.slice(lastWordBoundary).trim();
    if (remainingText) {
      yield remainingText;
    }
    
    // Yield metadata as final chunk if available
    if (currentMetadata) {
      yield { text: '', metadata: currentMetadata };
    }
  }
}

export default StreamEngine;