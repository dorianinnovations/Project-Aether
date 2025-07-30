# Adaptive-Chat Endpoint Testing Guide

This guide provides step-by-step instructions for testing the `/ai/adaptive-chat` endpoint from the terminal, including authentication and troubleshooting.

## Server Information

- **Base URL**: `https://server-a7od.onrender.com`
- **Endpoint**: `/ai/adaptive-chat`
- **Method**: POST
- **Authentication**: Required (Bearer token)

## Prerequisites

- `curl` installed
- `jq` installed (optional, for JSON formatting)

## Step 1: Check Server Status

First, verify the server is running:

```bash
curl -s https://server-a7od.onrender.com/
```

Expected response:
```json
{
  "status": "success",
  "message": "Numina AI Server is running",
  "timestamp": "2025-07-29T06:52:52.622Z",
  "version": "1.0.0"
}
```

## Step 2: Create Account (if needed)

If you don't have an account, create one:

```bash
curl -s -X POST https://server-a7od.onrender.com/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

Expected response:
```json
{
  "status": "success",
  "token": "your-jwt-token-here",
  "data": {
    "user": {
      "id": "user-id",
      "email": "your-email@example.com"
    }
  }
}
```

## Step 3: Login and Get Token

Login to get an authentication token:

```bash
curl -s -X POST https://server-a7od.onrender.com/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

**Note**: The login endpoint may be slow to respond. If it times out, try again or use a longer timeout:

```bash
curl -s --max-time 30 -X POST https://server-a7od.onrender.com/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

## Step 4: Extract Token

Save the token from the login response:

```bash
TOKEN=$(curl -s -X POST https://server-a7od.onrender.com/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }' | jq -r '.token')

echo "Token: $TOKEN"
```

## Step 5: Test Adaptive-Chat Endpoint

Now test the adaptive-chat endpoint with your token:

```bash
curl -s -X POST https://server-a7od.onrender.com/ai/adaptive-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "prompt": "Hello, how are you?"
  }'
```

## Step 6: Test with Streaming (if supported)

For streaming responses:

```bash
curl -s -X POST https://server-a7od.onrender.com/ai/adaptive-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "prompt": "Tell me a story",
    "stream": true
  }'
```

## Complete Script

Here's a complete script that handles the entire flow:

```bash
#!/bin/bash

# Configuration
EMAIL="your-email@example.com"
PASSWORD="your-password"
BASE_URL="https://server-a7od.onrender.com"

echo "🔍 Checking server status..."
SERVER_STATUS=$(curl -s $BASE_URL/)
echo "Server status: $SERVER_STATUS"

echo ""
echo "🔐 Logging in..."
LOGIN_RESPONSE=$(curl -s --max-time 30 -X POST $BASE_URL/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "Login response: $LOGIN_RESPONSE"

# Extract token using jq
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "Failed to get token"
    exit 1
fi

echo "Token obtained: ${TOKEN:0:20}..."

echo ""
echo "🤖 Testing adaptive-chat endpoint..."
CHAT_RESPONSE=$(curl -s -X POST $BASE_URL/ai/adaptive-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "prompt": "Hello! Can you tell me about yourself?"
  }')

echo "Chat response: $CHAT_RESPONSE"
```

## Error Handling

### Common Error Responses

1. **Not logged in**:
```json
{
  "status": "error",
  "message": "You are not logged in! Please log in to get access."
}
```

2. **Invalid token**:
```json
{
  "status": "error", 
  "message": "Invalid or expired token."
}
```

3. **Login timeout**:
```bash
# If login hangs, try with longer timeout
curl -s --max-time 60 -X POST https://server-a7od.onrender.com/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "password": "your-password"}'
```

## Troubleshooting

### Login Issues
- The login endpoint may be slow due to server load
- Try multiple times with different timeouts
- Check if the server is under heavy load

### Token Issues
- Tokens may expire after a certain time
- Re-login to get a fresh token
- Ensure the token is properly formatted in the Authorization header

### Network Issues
- Check your internet connection
- Try with verbose output: `curl -v`
- Check if the server is reachable: `curl -I https://server-a7od.onrender.com/`

## Quick Test Commands

### One-liner to test without authentication:
```bash
curl -s -X POST https://server-a7od.onrender.com/ai/adaptive-chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test"}' | jq .
```

### One-liner to test with fake token:
```bash
curl -s -X POST https://server-a7od.onrender.com/ai/adaptive-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token" \
  -d '{"prompt": "test"}' | jq .
```

## Expected Response Format

Successful response should look like:
```json
{
  "content": "AI response here...",
  "timestamp": "2025-07-29T06:52:52.622Z",
  "metadata": {
    "confidence": 0.95,
    "processingTime": 1234
  }
}
```

## Notes

- The server is hosted on Render and may have cold start delays
- Authentication is required for all AI endpoints
- The login endpoint may be slow during peak usage
- Always use HTTPS for all requests
- Consider implementing retry logic for production use