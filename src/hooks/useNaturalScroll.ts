/**
 * Natural Scroll Hook - Industry Standard Chat Scroll Behavior
 * Implements smooth, user-friendly scrolling that matches top AI companies
 */

import { useRef, useCallback, useEffect } from 'react';
import { FlatList, Dimensions, Keyboard } from 'react-native';

interface UseNaturalScrollOptions {
  messages: any[];
  isStreaming: boolean;
  onUserScrollUp?: (isScrolledUp: boolean) => void;
  onKeyboardShow?: () => void;
}

interface ScrollState {
  isUserScrolledUp: boolean;
  lastScrollOffset: number;
  contentHeight: number;
  shouldAutoScroll: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 100; // Approximate header height
const INPUT_HEIGHT = 120; // Approximate input area height
const VIEWPORT_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - INPUT_HEIGHT;
const SCROLL_THRESHOLD = 50; // Distance from bottom to consider "at bottom"
const USER_SCROLL_THRESHOLD = 20; // Minimum scroll distance to detect user intent

export const useNaturalScroll = ({ messages, isStreaming, onUserScrollUp, onKeyboardShow }: UseNaturalScrollOptions) => {
  const flatListRef = useRef<FlatList>(null);
  const scrollStateRef = useRef<ScrollState>({
    isUserScrolledUp: false,
    lastScrollOffset: 0,
    contentHeight: 0,
    shouldAutoScroll: true,
  });
  
  const animationFrameRef = useRef<number | null>(null);
  const pendingScrollRef = useRef<number | null>(null);
  const keyboardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const hasScrolledForCurrentMessage = useRef<boolean>(false);
  const hasScrolledForKeyboard = useRef<boolean>(false);
  const lastUserMessageCount = useRef<number>(0);

  // Smooth scroll to specific offset using RAF
  const smoothScrollToOffset = useCallback((targetOffset: number, animated: boolean = true) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    pendingScrollRef.current = targetOffset;
    
    animationFrameRef.current = requestAnimationFrame(() => {
      if (flatListRef.current && pendingScrollRef.current !== null) {
        flatListRef.current.scrollToOffset({
          offset: Math.max(0, pendingScrollRef.current),
          animated
        });
        pendingScrollRef.current = null;
      }
    });
  }, []);

  // Scroll to position latest user message at top of screen
  const scrollToLatestUserMessage = useCallback(() => {
    scrollStateRef.current.shouldAutoScroll = true;
    scrollStateRef.current.isUserScrolledUp = false;
    
    if (!flatListRef.current || messages.length === 0) return;
    
    // Find the latest message (should be the last one)
    const latestMessageIndex = messages.length - 1;
    
    // Scroll to position the latest message at the top of the viewport
    flatListRef.current.scrollToIndex({
      index: latestMessageIndex,
      animated: true,
      viewPosition: 0, 
      viewOffset: HEADER_HEIGHT + 100, 
    });
    
    // Notify parent component
    onUserScrollUp?.(false);
  }, [messages, onUserScrollUp]);

  // Snap to user's last sent message position
  const snapToUserMessage = useCallback(() => {
    // Cancel any pending animations
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (!flatListRef.current) return;
    
    // Find the last user message index
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }
    
    if (lastUserMessageIndex !== -1) {
      // Scroll to the specific user message index with smooth animation
      // viewPosition: 0 = top of viewport, but we account for header with viewOffset
      flatListRef.current.scrollToIndex({
        index: lastUserMessageIndex,
        animated: true,
        viewPosition: 0.1, // Position slightly below the very top for better visibility
        viewOffset: 0, // Let viewPosition handle the positioning
      });
    } else {
      // Fallback to top if no user message found
      flatListRef.current.scrollToOffset({
        offset: 0,
        animated: true
      });
    }
    
    // Reset scroll state for new conversation flow
    scrollStateRef.current.shouldAutoScroll = true;
    scrollStateRef.current.isUserScrolledUp = false;
    
    onUserScrollUp?.(false);
  }, [messages, onUserScrollUp]);

  // Progressive scroll for streaming content
  const progressiveScrollForStreaming = useCallback((contentHeight: number) => {
    const state = scrollStateRef.current;
    
    // Don't auto-scroll if user has manually scrolled up
    if (state.isUserScrolledUp || !state.shouldAutoScroll) {
      return;
    }

    // Calculate if content extends beyond viewport
    const visibleContentHeight = contentHeight;
    const maxVisibleHeight = VIEWPORT_HEIGHT;
    
    if (visibleContentHeight > maxVisibleHeight) {
      // Calculate exact amount to scroll to show new content
      const targetOffset = visibleContentHeight - maxVisibleHeight;
      
      // Smooth progressive scroll
      smoothScrollToOffset(targetOffset, true);
    }
  }, [smoothScrollToOffset]);

  // Handle user scroll events
  const handleScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const currentOffset = contentOffset.y;
    const maxOffset = Math.max(0, contentSize.height - layoutMeasurement.height);
    
    const state = scrollStateRef.current;
    
    // Detect user scrolling up
    const scrollingUp = currentOffset < state.lastScrollOffset - USER_SCROLL_THRESHOLD;
    const isNearBottom = maxOffset - currentOffset <= SCROLL_THRESHOLD;
    
    // Update scroll state
    if (scrollingUp && !isNearBottom) {
      // User is actively scrolling up to read previous messages
      state.isUserScrolledUp = true;
      state.shouldAutoScroll = false;
      onUserScrollUp?.(true);
    } else if (isNearBottom) {
      // User has scrolled back to bottom
      state.isUserScrolledUp = false;
      state.shouldAutoScroll = true;
      onUserScrollUp?.(false);
    }
    
    // Update tracking values
    state.lastScrollOffset = currentOffset;
    state.contentHeight = contentSize.height;
  }, [onUserScrollUp]);

  // Main effect to handle message changes - controlled single triggers
  useEffect(() => {
    if (messages.length === 0) {
      hasScrolledForCurrentMessage.current = false;
      lastUserMessageCount.current = 0;
      return;
    }

    // Count user messages to detect new user messages
    const currentUserMessageCount = messages.filter(msg => msg.sender === 'user').length;
    const hasNewUserMessage = currentUserMessageCount > lastUserMessageCount.current;
    
    const lastMessage = messages[messages.length - 1];
    const isStreamingResponse = isStreaming && lastMessage.sender !== 'user';

    if (hasNewUserMessage && !hasScrolledForCurrentMessage.current) {
      // Mark that we've scrolled for this message to prevent duplicates
      hasScrolledForCurrentMessage.current = true;
      lastUserMessageCount.current = currentUserMessageCount;
      
      // Clear any pending scroll debounce
      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
      }
      
      // Small delay to ensure message is rendered
      scrollDebounceRef.current = setTimeout(() => {
        // A) Position latest message at top of screen
        scrollToLatestUserMessage();
      }, 100);
    } else if (isStreamingResponse) {
      // Let streaming content flow naturally without any scroll interference
      // The user message is already positioned correctly, let streaming content appear below
    }
  }, [messages, isStreaming, scrollToLatestUserMessage, progressiveScrollForStreaming]);
  
  // Reset scroll flag when starting a new conversation
  useEffect(() => {
    const userMessageCount = messages.filter(msg => msg.sender === 'user').length;
    if (userMessageCount !== lastUserMessageCount.current) {
      hasScrolledForCurrentMessage.current = false;
    }
  }, [messages]);

  // Scroll to bottom when keyboard appears (when chat input is focused)
  const scrollToBottomOnKeyboard = useCallback(() => {
    if (flatListRef.current) {
      // Scroll to the very bottom to show the latest message
      flatListRef.current.scrollToEnd({ animated: true });
    }
    
    // Reset scroll state
    scrollStateRef.current.isUserScrolledUp = false;
    scrollStateRef.current.shouldAutoScroll = true;
    
    onUserScrollUp?.(false);
    onKeyboardShow?.();
  }, [onUserScrollUp, onKeyboardShow]);

  // Keyboard event listeners - single controlled scroll
  useEffect(() => {
    const keyboardDidShow = () => {
      // Only scroll once per keyboard show
      if (hasScrolledForKeyboard.current) return;
      
      hasScrolledForKeyboard.current = true;
      
      // Clear any existing timeout
      if (keyboardTimeoutRef.current) {
        clearTimeout(keyboardTimeoutRef.current);
      }
      
      // Single scroll attempt after keyboard animation settles
      keyboardTimeoutRef.current = setTimeout(() => {
        scrollToBottomOnKeyboard();
      }, 200);
    };
    
    const keyboardDidHide = () => {
      // Reset flag when keyboard hides
      hasScrolledForKeyboard.current = false;
    };

    const keyboardShowSubscription = Keyboard.addListener('keyboardDidShow', keyboardDidShow);
    const keyboardHideSubscription = Keyboard.addListener('keyboardDidHide', keyboardDidHide);

    return () => {
      keyboardShowSubscription.remove();
      keyboardHideSubscription.remove();
      if (keyboardTimeoutRef.current) {
        clearTimeout(keyboardTimeoutRef.current);
      }
    };
  }, [scrollToBottomOnKeyboard]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (keyboardTimeoutRef.current) {
        clearTimeout(keyboardTimeoutRef.current);
      }
      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
      }
    };
  }, []);

  // Scroll to bottom helper (for manual scroll-to-bottom button)
  const scrollToBottom = useCallback(() => {
    scrollStateRef.current.isUserScrolledUp = false;
    scrollStateRef.current.shouldAutoScroll = true;
    
    flatListRef.current?.scrollToEnd({ animated: true });
    onUserScrollUp?.(false);
  }, [onUserScrollUp]);

  // Get current scroll state
  const getScrollState = useCallback(() => ({
    isUserScrolledUp: scrollStateRef.current.isUserScrolledUp,
    shouldAutoScroll: scrollStateRef.current.shouldAutoScroll,
  }), []);

  return {
    flatListRef,
    handleScroll,
    scrollToBottom,
    scrollToLatestUserMessage,
    snapToUserMessage,
    scrollToBottomOnKeyboard,
    getScrollState,
    // Expose for testing
    smoothScrollToOffset,
    progressiveScrollForStreaming,
  };
};