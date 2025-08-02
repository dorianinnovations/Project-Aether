# EVERY ENDPOINT CALLED BY /ai/adaptive-chat PER REQUEST

## EXTERNAL APIS / LLMS
1. **OpenRouter/LLM API** - `llmService.makeLLMRequest()` or `llmService.makeStreamingRequest()`
   - Used for: AI response generation
   - Called: 1-2 times per request (depending on tool usage)

2. **External Image URLs** - `fetch(img.url)` (if image attachments from URLs)
   - Used for: Converting HTTP image URLs to base64
   - Called: 0-N times (only if user uploads image URLs)

## INTERNAL DATABASE CALLS

### Memory & Context Services
3. **proactiveMemoryService.getProactiveContext(userId, userMessage, contextLimit)**
   - Used for: Rich conversation context with pattern recognition
   - Called: 1 time per request
   - Database: ShortTermMemory collection queries

4. **enhancedMemoryService.getUserContext(userId, contextLimit)** (fallback)
   - Used for: Standard conversation context if proactive fails
   - Called: 0-1 times per request (only if proactive fails)
   - Database: ShortTermMemory collection queries

5. **proactiveMemoryService.saveWithPatternAnalysis(userId, userMessage, assistantResponse)**
   - Used for: Save conversation with pattern analysis
   - Called: 1 time per request 
   - Database: ShortTermMemory collection write

### Conversation Services  
6. **conversationService.addMessage(userId, conversationId, 'user', userMessage)**
   - Used for: Save user message to conversation history
   - Called: 1 time per request
   - Database: Conversation collection write

7. **conversationService.addMessage(userId, conversationId, 'assistant', assistantResponse)**
   - Used for: Save assistant response to conversation history  
   - Called: 1 time per request
   - Database: Conversation collection write

8. **enhancedMemoryService.saveConversation(userId, userMessage, assistantResponse)**
   - Used for: Enhanced memory storage
   - Called: 1 time per request
   - Database: ShortTermMemory collection write

### AI Context & Prompt Services
9. **dynamicPromptBuilder.buildDynamicPrompt(userId, conversationContext, userMessage)**
   - Used for: Generate cognitive signature-based system prompt
   - Called: 1 time per request
   - Database: UserBehaviorProfile collection read

10. **numinaContextBuilder.buildOptimizedSystemPrompt(userId, messages)** (fallback)
    - Used for: Standard optimized system prompt if dynamic fails
    - Called: 0-1 times per request (only if dynamic fails)
    - Database: UserBehaviorProfile collection read

11. **numinaContextBuilder.buildToolUsageGuidance(userId, userMessage)**
    - Used for: Smart tool usage decision making
    - Called: 1 time per request
    - Database: UserBehaviorProfile collection read

### Behavioral Analysis (Background)
12. **ubmpService.analyzeUserBehaviorPatterns(userId, 'chat_interaction')**
    - Used for: Background behavioral pattern analysis
    - Called: 1 time per request (fire-and-forget, not awaited)
    - Database: UserBehaviorProfile collection read/write

### Context Processing
13. **processContextInjection(userMessage, conversationContext)**
    - Used for: Enrich ambiguous queries with context
    - Called: 1 time per request
    - Database: None (in-memory processing)

## TOOL CALLS (Conditional)

### Web Search Tool
14. **insaneWebSearch(args, {userId, tier})**
    - Used for: Advanced web search when LLM requests it
    - Called: 0-N times per request (only if LLM uses search tool)
    - External: Web scraping APIs

### UBPM Analysis Tool  
15. **ubmpAnalysis(args, {userId})**
    - Used for: Real-time behavioral analysis when LLM requests it
    - Called: 0-N times per request (only if LLM uses UBPM tool)
    - Database: UserBehaviorProfile collection read

## SUMMARY PER REQUEST

### GUARANTEED CALLS (Every Request):
- 1x LLM API call (OpenRouter)
- 1x proactiveMemoryService.getProactiveContext
- 1x dynamicPromptBuilder.buildDynamicPrompt  
- 1x numinaContextBuilder.buildToolUsageGuidance
- 1x processContextInjection
- 1x ubmpService.analyzeUserBehaviorPatterns (background)
- 1x proactiveMemoryService.saveWithPatternAnalysis
- 2x conversationService.addMessage (user + assistant)
- 1x enhancedMemoryService.saveConversation

### CONDITIONAL CALLS:
- 0-1x enhancedMemoryService.getUserContext (fallback)
- 0-1x numinaContextBuilder.buildOptimizedSystemPrompt (fallback)
- 0-Nx fetch() for image URL conversion
- 0-Nx insaneWebSearch (tool calls)
- 0-Nx ubmpAnalysis (tool calls)
- 0-1x Additional LLM call (if tools used)

### DATABASE COLLECTIONS ACCESSED:
- **ShortTermMemory** (read/write)
- **UserBehaviorProfile** (read/write) 
- **Conversation** (write)
- **User** (read via protect middleware)

### ESTIMATED TOTAL: 9-15 internal calls + 1-2 external LLM calls per request