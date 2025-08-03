/**
 * Custom hook for managing message state and streaming logic
 */
import { useState, useEffect, useRef } from 'react';
import { FlatList, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { ChatAPI, ConversationAPI } from '../services/api';
import { Message, MessageAttachment } from '../types';

interface UseMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  handleSend: (inputText: string, attachments?: MessageAttachment[]) => Promise<void>;
  handleMessagePress: (message: Message) => Promise<void>;
  handleMessageLongPress: (message: Message) => void;
  handleConversationSelect: (conversation: any) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  flatListRef: React.RefObject<FlatList | null>;
}

export const useMessages = (onHideGreeting?: () => void): UseMessagesReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Track streaming state without legacy scroll logic
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const streaming = lastMessage.variant === 'streaming';
      setIsStreaming(streaming);
    } else {
      setIsStreaming(false);
    }
  }, [messages]);

  const handleSend = async (inputText: string, attachments: MessageAttachment[] = []) => {
    // Allow sending if there's text OR attachments
    if ((!inputText.trim() && attachments.length === 0) || isLoading) return;

    // Hide greeting on first message
    if (onHideGreeting) {
      onHideGreeting();
    }

    // Prepare message text for display (keep user input as-is)
    const displayText = inputText.trim();
    
    // Prepare prompt for API (include default prompt for attachment-only messages)
    const apiPrompt = displayText || (attachments.length > 0 ? "Please analyze this content." : "");
    
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      message: displayText,
      timestamp: new Date().toISOString(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };


    // Add user message with optimistic update
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Force immediate render cycle for better perceived performance
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      // Create streaming message
      const streamingMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'numina',
        message: '',
        timestamp: new Date().toISOString(),
        variant: 'streaming',
        metadata: {
          confidence: 0.95,
        },
      };

      setMessages(prev => [...prev, streamingMessage]);
      
      // Start streaming with word animation
      let accumulatedText = '';
      let wordCount = 0;
      let messageMetadata: any = undefined;
      
      for await (const chunk of ChatAPI.streamMessageWords(apiPrompt, '/ai/adaptive-chat', attachments)) {
        // Check if chunk is metadata object
        if (typeof chunk === 'object' && chunk !== null && 'metadata' in chunk) {
          messageMetadata = (chunk as any).metadata;
          continue;
        }
        
        // For word animation, each chunk is a complete word - add with space
        const word = typeof chunk === 'string' ? chunk : (chunk as any).text;
        accumulatedText += (accumulatedText ? ' ' : '') + word;
        wordCount++;
        
        // Update the streaming message while keeping streaming variant
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessage.id 
            ? { ...msg, message: accumulatedText, variant: 'streaming', timestamp: new Date().toISOString() }
            : msg
        ));
      }
      
      // Mark as complete with metadata if available
      setMessages(prev => prev.map(msg => 
        msg.id === streamingMessage.id 
          ? { 
              ...msg, 
              variant: 'default',
              metadata: messageMetadata ? {
                ...msg.metadata,
                ...messageMetadata,
                // Convert tool results format if needed
                toolCalls: messageMetadata.searchResults && messageMetadata.sources ? 
                  [{
                    id: 'search-' + Date.now(),
                    name: 'insane_web_search',
                    parameters: { query: messageMetadata.query },
                    result: {
                      sources: messageMetadata.sources,
                      query: messageMetadata.query
                    },
                    status: 'completed'
                  }] : messageMetadata.toolCalls
              } : msg.metadata
            }
          : msg
      ));
      
      // Refined haptic timing - trigger earlier for better UX
      const refinedHapticDelay = Math.min(300, Math.max(100, wordCount * 8)); // More responsive timing
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, refinedHapticDelay);

    } catch (error: any) {
      console.error('Chat Error:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        sender: 'system',
        message: `Error: ${error.message || 'Failed to send message'}`,
        timestamp: new Date().toISOString(),
        variant: 'error',
      };
      
      setMessages(prev => [...prev, errorMessage]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle message actions - instant copy to clipboard with improved haptic timing
  const handleMessagePress = async (message: Message) => {
    // Immediate haptic feedback for better responsiveness
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (message.message && message.message.trim()) {
      try {
        await Clipboard.setStringAsync(message.message);
        // Success haptic after copy completes
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 50);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  // Keep long press for metadata viewing (Numina messages only) with improved haptic timing
  const handleMessageLongPress = (message: Message) => {
    // Immediate haptic feedback on long press start
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (message.sender === 'numina' && message.metadata) {
      // Show message details
      Alert.alert(
        'Message Details',
        `Processing Time: ${message.metadata.processingTime}ms\nConfidence: ${(message.metadata.confidence || 0) * 100}%${message.metadata.toolUsed ? `\nTool Used: ${message.metadata.toolUsed}` : ''}`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  // Handle conversation selection
  const handleConversationSelect = async (conversation: any) => {
    try {
      setIsLoading(true);
      
      // Handle demo conversations
      if (conversation._id.startsWith('demo-')) {
        const demoMessages: Message[] = [
          {
            id: 'demo-welcome',
            sender: 'numina',
            message: `This is a demo of the "${conversation.title}" conversation. Sign in to access your real conversation history and continue chatting!`,
            timestamp: new Date().toISOString(),
            variant: 'default',
          }
        ];
        
        setMessages(demoMessages);
        return;
      }
      
      // Load the full conversation from server with max allowed messages (500)
      const fullConversation = await ConversationAPI.getConversation(conversation._id, 500);
      
      // Ensure we have messages
      if (!fullConversation.messages || !Array.isArray(fullConversation.messages)) {
        throw new Error('No messages found in conversation response');
      }
      
      // Convert server messages to app format
      const convertedMessages: Message[] = fullConversation.messages.map((msg: any, index: number) => ({
        id: msg._id || `${conversation._id}-${index}`,
        sender: msg.role === 'user' ? 'user' : 'numina',
        message: msg.content,
        timestamp: msg.timestamp,
        variant: 'default',
      }));
      
      // Replace current messages with loaded conversation
      setMessages(convertedMessages);
      
    } catch (error: any) {
      console.error('Failed to load conversation:', error);
      
      let errorTitle = 'Error Loading Conversation';
      let errorMessage = 'Failed to load conversation. Please try again.';
      
      if (error.status === 401) {
        errorTitle = 'Authentication Required';
        errorMessage = 'Please sign in to load your conversation history.';
      } else if (error.status === 404) {
        errorTitle = 'Conversation Not Found';
        errorMessage = 'This conversation may have been deleted or is no longer available.';
      } else if (error.status === 403) {
        errorTitle = 'Access Denied';
        errorMessage = 'You do not have permission to access this conversation.';
      } else if (error.message?.includes('No messages found')) {
        errorTitle = 'Empty Conversation';
        errorMessage = 'This conversation has no messages yet.';
      } else if (error.message?.includes('timeout')) {
        errorTitle = 'Connection Timeout';
        errorMessage = 'The request timed out. Please check your internet connection and try again.';
      } else if (error.status >= 500) {
        errorTitle = 'Server Error';
        errorMessage = 'The server is experiencing issues. Please try again later.';
      }
      
      Alert.alert(errorTitle, errorMessage, [{ text: 'OK', style: 'default' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    isStreaming,
    handleSend,
    handleMessagePress,
    handleMessageLongPress,
    handleConversationSelect,
    setMessages,
    flatListRef,
  };
};