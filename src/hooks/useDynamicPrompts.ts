/**
 * Dynamic Prompts Hook
 * Intelligent conversation-aware prompt generation system
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ConversationAnalyzer, Message } from '../utils/conversationAnalyzer';
import { PromptTemplateEngine, PromptOption, ConversationContext } from '../utils/promptTemplates';

interface UseDynamicPromptsProps {
  messages: Message[];
  onPromptExecute: (promptText: string) => void;
  enabled?: boolean;
  refreshInterval?: number; // Auto-refresh prompts every N messages
}

interface UseDynamicPromptsReturn {
  prompts: PromptOption[];
  isAnalyzing: boolean;
  context: ConversationContext | null;
  executePrompt: (promptId: string) => void;
  refreshPrompts: () => void;
  error: string | null;
}

/**
 * Custom hook for intelligent dynamic prompt generation
 */
export const useDynamicPrompts = ({
  messages,
  onPromptExecute,
  enabled = true,
  refreshInterval = 3
}: UseDynamicPromptsProps): UseDynamicPromptsReturn => {
  
  // State management
  const [prompts, setPrompts] = useState<PromptOption[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [context, setContext] = useState<ConversationContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalyzedLength, setLastAnalyzedLength] = useState(0);

  /**
   * Memoized conversation analysis to prevent unnecessary recalculations
   */
  const shouldAnalyze = useMemo(() => {
    if (!enabled || messages.length === 0) return false;
    
    // Analyze if:
    // 1. We haven't analyzed yet (context is null)
    // 2. New messages have been added since last analysis
    // 3. We've hit the refresh interval
    return (
      context === null ||
      messages.length !== lastAnalyzedLength ||
      (messages.length > 0 && messages.length % refreshInterval === 0 && messages.length !== lastAnalyzedLength)
    );
  }, [enabled, messages.length, lastAnalyzedLength, refreshInterval]);

  /**
   * Core analysis and prompt generation function
   */
  const analyzeAndGeneratePrompts = useCallback(async () => {
    if (!enabled || messages.length === 0) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Validate messages before analysis
      const validMessages = messages.filter(m => 
        m && 
        typeof m === 'object' && 
        m.text && 
        typeof m.text === 'string' &&
        m.sender &&
        typeof m.sender === 'string'
      );

      if (validMessages.length === 0) {
        setPrompts([]);
        setIsAnalyzing(false);
        return;
      }

      // Step 1: Analyze conversation context
      const newContext = ConversationAnalyzer.analyze(validMessages);
      setContext(newContext);

      // Step 2: Generate intelligent prompts based on context
      const newPrompts = PromptTemplateEngine.generateOptions(newContext);
      setPrompts(newPrompts);

      setLastAnalyzedLength(messages.length);
      

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze conversation';
      setError(errorMessage);
      console.error('Dynamic Prompts Error:', err);
      
      // Fallback to basic prompts if analysis fails
      setPrompts([
        {
          id: 'fallback-expand',
          displayText: 'Explore related ideas',
          hiddenPrompt: 'Based on our conversation, suggest 3 related concepts that might be interesting to explore further.',
          archetype: 'expand',
          category: 'exploration'
        },
        {
          id: 'fallback-deepen',
          displayText: 'Go deeper',
          hiddenPrompt: 'Help me understand the deeper implications and underlying patterns in what we\'ve discussed.',
          archetype: 'deepen',
          category: 'insight'
        },
        {
          id: 'fallback-flip',
          displayText: 'Different perspective',
          hiddenPrompt: 'Show me an alternative way of looking at the topics we\'ve been discussing.',
          archetype: 'flip',
          category: 'perspective'
        }
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  }, [enabled, messages]);

  /**
   * Execute a specific prompt (the magic happens here)
   */
  const executePrompt = useCallback((promptId: string) => {
    const selectedPrompt = prompts.find(p => p.id === promptId);
    
    if (!selectedPrompt) {
      console.warn(`Prompt with ID ${promptId} not found`);
      return;
    }

    // This is where the magic happens - we execute the hidden prompt,
    // not the display text the user sees
    onPromptExecute(selectedPrompt.hiddenPrompt);

  }, [prompts, onPromptExecute]);

  /**
   * Manual refresh function
   */
  const refreshPrompts = useCallback(() => {
    setLastAnalyzedLength(0); // Force re-analysis
  }, []);

  /**
   * Incremental context updates for performance
   */
  useEffect(() => {
    if (messages.length > 0 && context && messages.length === lastAnalyzedLength + 1) {
      // For single message additions, do a quick incremental update
      const lastMessage = messages[messages.length - 1];
      const updatedContext = ConversationAnalyzer.updateContext(context, lastMessage);
      setContext(updatedContext);
    }
  }, [messages, context, lastAnalyzedLength]);

  /**
   * Main analysis trigger
   */
  useEffect(() => {
    if (shouldAnalyze) {
      analyzeAndGeneratePrompts();
    }
  }, [shouldAnalyze]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      setPrompts([]);
      setContext(null);
      setError(null);
    };
  }, []);

  return {
    prompts,
    isAnalyzing,
    context,
    executePrompt,
    refreshPrompts,
    error
  };
};

export default useDynamicPrompts;