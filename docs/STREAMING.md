# AetherMobile Streaming Configuration

## Overview

AetherMobile implements real-time server-sent event (SSE) streaming for chat responses using a React Native-compatible approach. This document outlines the streaming architecture and configuration.

## Architecture

### Core Components

1. **`cleanStreaming.ts`** - Main streaming implementation
2. **`api.ts`** - API integration layer  
3. **`ChatScreen.tsx`** - UI integration
4. **`EnhancedMessageBubble.tsx`** - Real-time message display

### Streaming Flow

```
User Input → ChatScreen → ChatAPI → cleanStreaming → XMLHttpRequest → Server
                                                                        ↓
Bot Response ← Message UI ← State Update ← Async Generator ← SSE Parser ←
```

## Implementation Details

### XMLHttpRequest Approach

React Native doesn't fully support `ReadableStream` with `fetch()`, so we use `XMLHttpRequest` for reliable streaming:

```typescript
// Key configuration
xhr.open('POST', url, true);
xhr.setRequestHeader('Accept', 'text/event-stream');
xhr.setRequestHeader('Cache-Control', 'no-cache');
```

### Async Generator Pattern

The streaming uses an async generator to yield chunks as they arrive:

```typescript
export async function* streamChatResponse(
  prompt: string,
  endpoint: string = '/ai/adaptive-chat'
): AsyncGenerator<string, void, unknown>
```

### Queue-Based Processing

- **Chunk Queue**: Incoming chunks are queued for processing
- **Promise Resolver**: Notifies waiting consumers when new chunks arrive
- **Sequential Processing**: Chunks are yielded in the order received

## Server Response Format

The server sends SSE events in this format:

```
data: {"content": "Hello"}
data: {"content": " world"}
data: {"content": "!"}
data: [DONE]
```

### Supported Response Fields

The parser handles multiple response formats:
- `parsed.content` (primary)
- `parsed.data.content` (nested)
- `parsed.message` (alternative)
- `parsed.text` (fallback)
- Direct string responses

## Configuration

### Endpoints

- **Primary**: `/ai/adaptive-chat`
- **Alternative**: `/personalized-ai/contextual-chat`

### Timeouts & Error Handling

```typescript
xhr.timeout = 60000; // 60 second timeout

// Error handling
xhr.onerror = () => { /* Network error */ }
xhr.ontimeout = () => { /* Timeout error */ }
```

### Fallback Strategy

If streaming fails:
1. Detect streaming failure
2. Attempt non-streaming API call
3. Display complete response
4. Maintain user experience

## UI Integration

### Real-time Updates

```typescript
for await (const chunk of ChatAPI.streamMessage(messageText)) {
  accumulatedText += chunk;
  
  setMessages(prev => prev.map(msg => 
    msg.id === streamingMsg.id 
      ? { ...msg, message: accumulatedText }
      : msg
  ));
}
```

### Message States

- **Typing**: Shows Lottie animation while waiting
- **Streaming**: Updates message text in real-time
- **Complete**: Finalizes message with metadata

### Loading Animation

The typing indicator uses a Lottie animation:
- File: `assets/BotMessageLottie.json`
- Size: 50x28 pixels
- Minimal padding for compact display

## Authentication

Streaming requests include Bearer token authentication:

```typescript
const token = await TokenManager.getToken();
if (token) {
  xhr.setRequestHeader('Authorization', `Bearer ${token}`);
}
```

## Performance Considerations

### Memory Management
- Chunks are processed sequentially
- No chunk accumulation in memory
- Efficient string concatenation

### Network Efficiency  
- Single persistent connection
- Real-time chunk processing
- Minimal bandwidth overhead

### Error Recovery
- Automatic fallback to non-streaming
- Graceful error handling
- User experience preservation

## Debugging

For development debugging, temporarily add logs:

```typescript
console.log('Starting stream to', endpoint);
console.log('Got chunk:', content.substring(0, 30) + '...');
console.log('Yielding chunk:', chunk);
```

Remove all debug logs before production deployment.

## Future Enhancements

### Potential Improvements
- WebSocket fallback option
- Chunk compression support  
- Advanced retry mechanisms
- Stream resume capability
- Progress indicators

### Server Optimizations
- Chunk size optimization
- Response caching strategies
- Load balancing considerations
- Rate limiting integration

## Troubleshooting

### Common Issues

1. **No chunks received**: Check server endpoint and authentication
2. **Chunks not displaying**: Verify async generator is yielding
3. **Connection timeouts**: Adjust timeout values or server response time
4. **JSON parsing errors**: Ensure server sends valid JSON in SSE format

### Debug Steps

1. Check network connectivity
2. Verify authentication token
3. Inspect server response format
4. Monitor async generator flow
5. Test fallback mechanism