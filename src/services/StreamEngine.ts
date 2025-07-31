/**
 * StreamEngine - Proprietary Intelligent Streaming System
 * Word-based streaming with real-time processing
 * Backend sends: data: {"content":"text","tier":"core","cognitiveEngineActive":true}
 * Backend ends with: data: [DONE]
 */

import { TokenManager } from './api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://server-a7od.onrender.com';

export class StreamEngine {
  /**
   * React Native compatible streaming that yields complete words for animation
   */
  static async *streamChat(
    prompt: string,
    endpoint: string = '/ai/adaptive-chat',
    attachments?: any[]
  ): AsyncGenerator<string, void, unknown> {
    
    // For photo attachments, fall back to non-streaming (as per backend)
    if (attachments && attachments.length > 0) {
      const { ChatAPI } = await import('./api');
      const response = await ChatAPI.sendMessage(prompt, false, attachments);
      // Split response into words for consistent behavior
      const words = response.content.split(/(\s+)/);
      for (const word of words) {
        if (word.trim()) {
          yield word;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      return;
    }
    
    const token = await TokenManager.getToken();
    const url = `${API_BASE_URL}${endpoint}`;
    
    const chunks: string[] = [];
    let completed = false;
    let buffer = '';
    let processedChunks = 0;
    let accumulatedText = '';
    let lastWordBoundary = 0;
    
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
  }
}

export default StreamEngine;