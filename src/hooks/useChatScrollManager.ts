/**
 * Chat Scroll Manager Hook
 * Centralized, intelligent scroll handling for chat interfaces
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

interface ScrollMetrics {
  contentHeight: number;
  layoutHeight: number;
  contentOffset: number;
  isNearBottom: boolean;
  isAtTop: boolean;
  isAtBottom: boolean;
}

interface ScrollManagerConfig {
  /** Threshold distance from bottom to consider "near bottom" */
  nearBottomThreshold?: number;
  /** Minimum time between auto-scrolls to prevent excessive calls */
  autoScrollThrottleMs?: number;
  /** Whether to auto-scroll on new messages when user is near bottom */
  autoScrollOnNewMessage?: boolean;
  /** Whether to auto-scroll during streaming responses */
  autoScrollDuringStreaming?: boolean;
  /** Debounce time for scroll event handling */
  scrollEventDebounceMs?: number;
}

interface ScrollManagerState {
  isUserScrolling: boolean;
  isNearBottom: boolean;
  isAtBottom: boolean;
  isAtTop: boolean;
  showScrollToBottomButton: boolean;
  lastAutoScrollTime: number;
  userHasScrolledUp: boolean;
}

export const useChatScrollManager = (config: ScrollManagerConfig = {}) => {
  const {
    nearBottomThreshold = 100,
    autoScrollThrottleMs = 100,
    autoScrollOnNewMessage = true,
    autoScrollDuringStreaming = true,
    scrollEventDebounceMs = 16,
  } = config;

  const flatListRef = useRef<FlatList>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollEventTime = useRef<number>(0);
  const userScrollDetectionTimeout = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<ScrollManagerState>({
    isUserScrolling: false,
    isNearBottom: true,
    isAtBottom: true,
    isAtTop: true,
    showScrollToBottomButton: false,
    lastAutoScrollTime: 0,
    userHasScrolledUp: false,
  });

  // Calculate scroll metrics from native event
  const calculateScrollMetrics = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>): ScrollMetrics => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const contentHeight = contentSize.height;
    const layoutHeight = layoutMeasurement.height;
    const contentOffsetY = contentOffset.y;

    const isAtTop = contentOffsetY <= 10;
    const isAtBottom = contentOffsetY + layoutHeight >= contentHeight - 10;
    const isNearBottom = contentOffsetY + layoutHeight >= contentHeight - nearBottomThreshold;

    return {
      contentHeight,
      layoutHeight,
      contentOffset: contentOffsetY,
      isNearBottom,
      isAtTop,
      isAtBottom,
    };
  }, [nearBottomThreshold]);

  // Debounced scroll event handler
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const now = Date.now();
    
    // Debounce scroll events
    if (now - lastScrollEventTime.current < scrollEventDebounceMs) {
      return;
    }
    lastScrollEventTime.current = now;

    const metrics = calculateScrollMetrics(event);

    setState(prevState => {
      const newState: ScrollManagerState = {
        ...prevState,
        isNearBottom: metrics.isNearBottom,
        isAtBottom: metrics.isAtBottom,
        isAtTop: metrics.isAtTop,
        showScrollToBottomButton: !metrics.isNearBottom && metrics.contentHeight > metrics.layoutHeight + 200,
      };

      // Detect if user has scrolled up (indicating manual interaction)
      // Very sensitive detection: if user moves away from near-bottom
      if (!metrics.isNearBottom && prevState.isNearBottom) {
        newState.userHasScrolledUp = true;
        newState.isUserScrolling = true;
      }
      
      // Only reset scroll flags if user explicitly scrolls back to the very bottom
      if (metrics.isAtBottom && prevState.userHasScrolledUp) {
        newState.userHasScrolledUp = false;
      }

      return newState;
    });

    // Clear user scrolling detection after a delay
    if (userScrollDetectionTimeout.current) {
      clearTimeout(userScrollDetectionTimeout.current);
      userScrollDetectionTimeout.current = null;
    }
    
    setState(prevState => ({ ...prevState, isUserScrolling: true }));
    
    userScrollDetectionTimeout.current = setTimeout(() => {
      setState(prevState => ({ ...prevState, isUserScrolling: false }));
    }, 1000);

  }, [calculateScrollMetrics, scrollEventDebounceMs]);

  // Smart positioning function for conversation flow
  const positionForNewMessage = useCallback((options: { 
    animated?: boolean; 
    force?: boolean; 
    reason?: 'new_message' | 'streaming' | 'user_action' | 'load_conversation';
  } = {}) => {
    const { animated = true, force = false, reason = 'user_action' } = options;
    const now = Date.now();

    // Throttle auto-scrolls to prevent excessive calls
    if (!force && now - state.lastAutoScrollTime < autoScrollThrottleMs) {
      return;
    }

    // Don't auto-scroll if user has manually scrolled up, unless forced
    if (!force && reason !== 'user_action') {
      if (reason === 'new_message' && !autoScrollOnNewMessage) return;
      if (reason === 'streaming' && !autoScrollDuringStreaming) return;
      
      // Don't auto-scroll if user has scrolled up AT ALL
      if (state.userHasScrolledUp) {
        return;
      }
    }

    // Clear any pending scroll operations
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }

    // Execute positioning ONLY for streaming
    scrollTimeoutRef.current = setTimeout(() => {
      if (reason === 'streaming') {
        // For streaming, scroll to end then back up to create flow space
        flatListRef.current?.scrollToEnd({ animated: true });
        setTimeout(() => {
          // Get current scroll position and scroll back up to create space
          const currentOffset = (flatListRef.current as any)?._listRef?._scrollMetrics?.offset || 0;
          flatListRef.current?.scrollToOffset({
            offset: Math.max(0, currentOffset - 120), // Scroll back 120px for flow space
            animated: false
          });
        }, 50);
      } else if (reason === 'user_action' || reason === 'load_conversation') {
        // Only allow manual user actions or conversation loads
        flatListRef.current?.scrollToEnd({ animated: animated });
      }
      // All other cases: DO NOTHING
    }, 50);

    setState(prevState => ({
      ...prevState,
      lastAutoScrollTime: now,
      // Reset user scroll flags when we explicitly position
      userHasScrolledUp: reason === 'user_action' ? false : prevState.userHasScrolledUp,
      isUserScrolling: false,
    }));

  }, [state.lastAutoScrollTime, state.userHasScrolledUp, autoScrollThrottleMs, autoScrollOnNewMessage, autoScrollDuringStreaming]);

  // Scroll to bottom button handler
  const handleScrollToBottomPress = useCallback(() => {
    positionForNewMessage({ force: true, reason: 'user_action', animated: true });
  }, [positionForNewMessage]);

  // Reset scroll state (useful when loading new conversation)
  const resetScrollState = useCallback(() => {
    setState({
      isUserScrolling: false,
      isNearBottom: true,
      isAtBottom: true,
      isAtTop: true,
      showScrollToBottomButton: false,
      lastAutoScrollTime: 0,
      userHasScrolledUp: false,
    });
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
      if (userScrollDetectionTimeout.current) {
        clearTimeout(userScrollDetectionTimeout.current);
        userScrollDetectionTimeout.current = null;
      }
    };
  }, []);

  return {
    // Refs
    flatListRef,
    
    // State
    isUserScrolling: state.isUserScrolling,
    isNearBottom: state.isNearBottom,
    isAtBottom: state.isAtBottom,
    isAtTop: state.isAtTop,
    showScrollToBottomButton: state.showScrollToBottomButton,
    userHasScrolledUp: state.userHasScrolledUp,
    
    // Actions
    positionForNewMessage,
    handleScrollToBottomPress,
    handleScroll,
    resetScrollState,
    
    // Props for FlatList
    scrollEventThrottle: scrollEventDebounceMs,
    onScroll: handleScroll,
  };
};