import { useRef, useCallback, useState } from 'react';
import { FlatList } from 'react-native';

export const useSimpleScroll = () => {
  const flatListRef = useRef<FlatList>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track when user is actively scrolling and show/hide button
  const handleScrollBegin = useCallback(() => {
    setIsUserScrolling(true);
    setShowScrollButton(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  }, []);

  const handleScrollEnd = useCallback(() => {
    // Give user a moment after they stop scrolling before we resume auto-scroll
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
      setShowScrollButton(false);
    }, 2000);
  }, []);

  // Smooth scroll to bottom (for input focus)
  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  // Gentle pull down (for new messages, but respect user scrolling)
  const gentleScrollDown = useCallback(() => {
    if (!isUserScrolling) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [isUserScrolling]);

  return {
    flatListRef,
    scrollToBottom,
    gentleScrollDown,
    handleScrollBegin,
    handleScrollEnd,
    showScrollButton,
  };
};