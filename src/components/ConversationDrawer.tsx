/**
 * ConversationDrawer - Premium slide-out conversation history
 * Combines the best of numina-mobile's design with Numina's modern architecture
 * Features: BlurView backgrounds, haptic feedback, smooth animations, gesture handling
 * Optimized with react-native-reanimated for 120fps performance
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedGestureHandler,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  GestureHandlerRootView,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
// import { BlurView } from 'expo-blur'; // Commented out for now
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Design System
import { designTokens, getThemeColors, getStandardBorder } from '../design-system/tokens/colors';
import { useTheme } from '../contexts/ThemeContext';
import { typography } from '../design-system/tokens/typography';
import { spacing } from '../design-system/tokens/spacing';
import { getGlassmorphicStyle } from '../design-system/tokens/glassmorphism';
import Icon from '../design-system/components/atoms/Icon';
import LottieView from 'lottie-react-native';

// Services
import { ConversationAPI } from '../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const DRAWER_WIDTH = screenWidth * 0.80; // Slightly smaller like numina-mobile
const DRAWER_HEIGHT = screenHeight; // Full height for better UX
const MAX_SLIDE_DISTANCE = screenWidth * 0.15; // Limit how far the drawer can be pulled out
const DRAWER_TOP_MARGIN = 0; // No top margin for full height

interface Conversation {
  _id: string;
  title: string;
  lastActivity: string;
  messageCount: number;
  summary?: string;
}

interface ConversationDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  onConversationSelect: (conversation: Conversation) => void;
  onStartNewChat?: () => void;
  currentConversationId?: string;
  theme: 'light' | 'dark';
}

const ConversationDrawer: React.FC<ConversationDrawerProps> = ({
  isVisible,
  onClose,
  onConversationSelect,
  onStartNewChat,
  currentConversationId,
  theme,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [allowInteraction, setAllowInteraction] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearStatus, setClearStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle');
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  
  // Timeout refs for cleanup
  const conversationSelectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const clearSuccessTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const clearCloseTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const deleteSuccessTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const deleteCloseTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const deleteRetryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  

  const themeColors = getThemeColors(theme);
  
  // Page configuration
  const pages = [
    { title: 'Recent', id: 'recent' },
    { title: 'All Chats', id: 'all' },
    { title: 'Favorites', id: 'favorites' },
  ];
  
  // Reanimated shared values for smooth 120fps animations
  const translateX = useSharedValue(-DRAWER_WIDTH);
  const overlayOpacity = useSharedValue(0);
  const gestureTranslateX = useSharedValue(0);
  const drawerScale = useSharedValue(0.98);
  const drawerOpacity = useSharedValue(0);
  const shadowOpacity = useSharedValue(0);
  const shadowRadius = useSharedValue(5);
  
  // Modal animation values
  const clearOverlayOpacity = useSharedValue(0);
  const clearContainerScale = useSharedValue(0.3);
  const clearContainerOpacity = useSharedValue(0);
  const trashScale = useSharedValue(1);
  const checkOpacity = useSharedValue(0);
  
  const deleteOverlayOpacity = useSharedValue(0);
  const deleteContainerScale = useSharedValue(0.3);
  const deleteContainerOpacity = useSharedValue(0);
  const deleteTrashScale = useSharedValue(1);
  const deleteCheckOpacity = useSharedValue(0);

  // Load conversations when drawer opens with improved animation handling
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      setAllowInteraction(false);
      loadConversations();
      showDrawer();
    } else if (!isVisible && isAnimating) {
      setAllowInteraction(false);
      hideDrawer();
    }
  }, [isVisible]);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all timeout refs
      if (conversationSelectTimeoutRef.current) {
        clearTimeout(conversationSelectTimeoutRef.current);
      }
      if (clearSuccessTimeoutRef.current) {
        clearTimeout(clearSuccessTimeoutRef.current);
      }
      if (clearCloseTimeoutRef.current) {
        clearTimeout(clearCloseTimeoutRef.current);
      }
      if (deleteSuccessTimeoutRef.current) {
        clearTimeout(deleteSuccessTimeoutRef.current);
      }
      if (deleteCloseTimeoutRef.current) {
        clearTimeout(deleteCloseTimeoutRef.current);
      }
      if (deleteRetryTimeoutRef.current) {
        clearTimeout(deleteRetryTimeoutRef.current);
      }
    };
  }, []);

  const loadConversations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ConversationAPI.getRecentConversations(20);
      const conversations = response.conversations || [];
      
      // Filter out duplicate conversations and ensure unique entries
      const uniqueConversations = conversations.filter((conversation: Conversation, index: number, self: Conversation[]) => 
        index === self.findIndex((c: Conversation) => c._id === conversation._id)
      );
      
      setConversations(uniqueConversations);
    } catch (err: any) {
      console.error('Conversation loading error:', err);
      
      // Handle specific error cases
      if (err.status === 401) {
        // Show demo conversations when not authenticated
        const demoConversations = [
          {
            _id: 'demo-1',
            title: 'Getting started with Numina',
            lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            messageCount: 8,
            summary: 'Introduction to Numina\'s capabilities and features'
          },
          {
            _id: 'demo-2', 
            title: 'Exploring personal insights',
            lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            messageCount: 12,
            summary: 'Discussion about behavioral patterns and growth opportunities'
          },
          {
            _id: 'demo-3',
            title: 'AI assistance and productivity',
            lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            messageCount: 15,
            summary: 'Tips for maximizing productivity with AI assistance'
          }
        ];
        setConversations(demoConversations);
        setError('Demo conversations shown. Log in to see your actual conversation history.');
      } else if (err.message?.includes('timeout')) {
        setError('Connection timeout. Please check your internet connection.');
      } else if (err.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Failed to load conversations. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const showDrawer = () => {
    // Smooth door-like slide with refined timing and easing
    translateX.value = withTiming(0, {
      duration: 450, // Slower for more door-like feel
      easing: Easing.bezier(0.215, 0.61, 0.355, 1), // Smooth ease-out cubic-bezier
    }, () => {
      runOnJS(setIsAnimating)(false);
      runOnJS(setAllowInteraction)(true);
    });
    
    // Subtle scale animation for depth - refined timing
    drawerScale.value = withTiming(1, {
      duration: 500, // Slightly longer for smoothness
      easing: Easing.bezier(0.23, 1, 0.32, 1), // Smooth ease-out without bounce
    });
    
    drawerOpacity.value = withTiming(1, {
      duration: 350, // Longer fade-in
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Smooth cubic-bezier
    });
    
    // Gradual shadow buildup for depth perception
    shadowOpacity.value = withTiming(0.15, {
      duration: 450, // Match main animation
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    });
    
    shadowRadius.value = withTiming(12, {
      duration: 500, // Slightly longer
      easing: Easing.bezier(0.215, 0.61, 0.355, 1),
    });
    
    overlayOpacity.value = withTiming(0.6, {
      duration: 400, // Longer overlay fade
      easing: Easing.bezier(0.215, 0.61, 0.355, 1),
    });
    
    // Allow overlay interaction smoothly
    setTimeout(() => {
      setAllowInteraction(true);
    }, 150); // Slightly longer delay
  };

  const hideDrawer = () => {
    // Smooth door-like close with refined timing - feels like a heavy sliding door
    translateX.value = withTiming(-DRAWER_WIDTH, {
      duration: 380, // Slower, more deliberate close
      easing: Easing.bezier(0.42, 0, 0.58, 1), // Smooth ease-in-out for door-like motion
    }, () => {
      runOnJS(setIsAnimating)(false);
      runOnJS(setAllowInteraction)(true);
    });
    
    drawerScale.value = withTiming(0.95, {
      duration: 350, // Slower scale transition
      easing: Easing.bezier(0.42, 0, 0.58, 1), // Consistent easing
    });
    
    drawerOpacity.value = withTiming(0, {
      duration: 300, // Longer fade-out
      easing: Easing.bezier(0.42, 0, 0.58, 1), // Smooth fade
    });
    
    // Gradual shadow reduction - matches the door closing feel
    shadowOpacity.value = withTiming(0, {
      duration: 250, // Longer shadow fade
      easing: Easing.bezier(0.42, 0, 0.58, 1),
    });
    
    shadowRadius.value = withTiming(5, {
      duration: 320, // Longer radius transition
      easing: Easing.bezier(0.42, 0, 0.58, 1),
    });
    
    overlayOpacity.value = withTiming(0, {
      duration: 320, // Longer overlay fade
      easing: Easing.bezier(0.42, 0, 0.58, 1), // Consistent smooth easing
    }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  };

  const handleConversationPress = (conversation: Conversation) => {
    // Perfect tactile feedback for selection
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Clear any existing timeout
    if (conversationSelectTimeoutRef.current) {
      clearTimeout(conversationSelectTimeoutRef.current);
    }
    
    // Micro-delay for satisfaction (like clicking a physical button)
    conversationSelectTimeoutRef.current = setTimeout(() => {
      onConversationSelect(conversation);
      hideDrawer();
    }, 50);
  };

  const handleOverlayPress = () => {
    if (allowInteraction) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onClose();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadConversations();
      await new Promise(resolve => setTimeout(resolve, 1500));
    } finally {
      setRefreshing(false);
    }
  };

  const showClearAllModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowClearModal(true);
    clearOverlayOpacity.value = withTiming(1, { duration: 300 });
    clearContainerScale.value = withSpring(1, { damping: 10, stiffness: 100 });
    clearContainerOpacity.value = withTiming(1, { duration: 300 });
  };

  const hideClearModal = () => {
    clearOverlayOpacity.value = withTiming(0, { duration: 200 });
    clearContainerScale.value = withTiming(0.3, { duration: 200 });
    clearContainerOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setShowClearModal)(false);
      runOnJS(setIsClearing)(false);
      runOnJS(setClearStatus)('idle');
      trashScale.value = 1;
      checkOpacity.value = 0;
    });
  };

  const confirmClearAll = async () => {
    setIsClearing(true);
    setClearStatus('deleting');
    
    try {
      // Animate trash can
      trashScale.value = withTiming(1.2, { duration: 150 }, () => {
        trashScale.value = withTiming(0, { duration: 300 });
      });

      // Delete all conversations
      await ConversationAPI.deleteAllConversations();
      
      setConversations([]);
      setClearStatus('success');
      
      // Clear any existing timeouts
      if (clearSuccessTimeoutRef.current) {
        clearTimeout(clearSuccessTimeoutRef.current);
      }
      if (clearCloseTimeoutRef.current) {
        clearTimeout(clearCloseTimeoutRef.current);
      }
      
      // Show success animation
      clearSuccessTimeoutRef.current = setTimeout(() => {
        checkOpacity.value = withTiming(1, { duration: 300 });
      }, 400);

      // Close modal after success
      clearCloseTimeoutRef.current = setTimeout(() => {
        if (currentConversationId) {
          onClose();
        }
        hideClearModal();
      }, 1500);

    } catch (error: any) {
      console.error('Failed to clear conversations:', error);
      setClearStatus('error');
      
      Alert.alert(
        'Error', 
        error.message || 'Failed to clear conversations. Please try again.',
        [{ text: 'OK', style: 'default', onPress: () => hideClearModal() }]
      );
      setIsClearing(false);
    }
  };

  const showDeleteConversationModal = (conversationId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setConversationToDelete(conversationId);
    setShowDeleteModal(true);
    deleteOverlayOpacity.value = withTiming(1, { duration: 300 });
    deleteContainerScale.value = withSpring(1, { damping: 10, stiffness: 100 });
    deleteContainerOpacity.value = withTiming(1, { duration: 300 });
  };

  const hideDeleteModal = () => {
    deleteOverlayOpacity.value = withTiming(0, { duration: 200 });
    deleteContainerScale.value = withTiming(0.3, { duration: 200 });
    deleteContainerOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setShowDeleteModal)(false);
      runOnJS(setIsDeleting)(false);
      runOnJS(setDeleteStatus)('idle');
      runOnJS(setConversationToDelete)(null);
      deleteTrashScale.value = 1;
      deleteCheckOpacity.value = 0;
    });
  };

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete) return;
    
    setIsDeleting(true);
    setDeleteStatus('deleting');
    
    try {
      // Animate trash can
      deleteTrashScale.value = withTiming(1.2, { duration: 150 }, () => {
        deleteTrashScale.value = withTiming(0, { duration: 300 });
      });

      // Delete conversation via real API - wait for database confirmation
      await ConversationAPI.deleteConversation(conversationToDelete);
      setConversations(prev => prev.filter(c => c._id !== conversationToDelete));
      setDeleteStatus('success');
      
      // Clear any existing timeouts
      if (deleteSuccessTimeoutRef.current) {
        clearTimeout(deleteSuccessTimeoutRef.current);
      }
      if (deleteCloseTimeoutRef.current) {
        clearTimeout(deleteCloseTimeoutRef.current);
      }
      
      // Show success animation
      deleteSuccessTimeoutRef.current = setTimeout(() => {
        deleteCheckOpacity.value = withTiming(1, { duration: 300 });
      }, 400);

      // Close modal after success
      deleteCloseTimeoutRef.current = setTimeout(() => {
        if (conversationToDelete === currentConversationId) {
          onClose();
        }
        hideDeleteModal();
      }, 1500);

    } catch (error: any) {
      console.error('Failed to delete conversation:', error);
      setDeleteStatus('error');
      
      // Provide more specific error messages
      let errorMessage = 'Failed to delete conversation. Please try again.';
      if (error.message?.includes('Network error')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message?.includes('Authentication failed')) {
        errorMessage = 'Session expired. Please sign in again to delete conversations.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message?.includes('attempts')) {
        errorMessage = 'Server is temporarily unavailable. Please try again in a few minutes.';
      }
      
      Alert.alert('Delete Conversation Failed', errorMessage, [
        { text: 'OK', style: 'default' },
        { text: 'Retry', style: 'default', onPress: () => {
          setDeleteStatus('idle');
          // Clear any existing retry timeout
          if (deleteRetryTimeoutRef.current) {
            clearTimeout(deleteRetryTimeoutRef.current);
          }
          deleteRetryTimeoutRef.current = setTimeout(() => confirmDeleteConversation(), 500);
        }}
      ]);
      setIsDeleting(false);
    }
  };

  const handleDeleteConversation = (conversationId: string) => {
    showDeleteConversationModal(conversationId);
  };

  const handlePageChange = (pageIndex: number) => {
    setCurrentPage(pageIndex);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const navigateToPage = (pageIndex: number) => {
    pagerRef.current?.setPage(pageIndex);
    setCurrentPage(pageIndex);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Gesture handling for smooth dragging with constraints
  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      // Reset gesture translation and add subtle haptic feedback
      gestureTranslateX.value = 0;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    },
    onActive: (event) => {
      const { translationX } = event;
      
      // Constrain the gesture to prevent showing the backside
      const currentPosition = translateX.value + translationX;
      
      if (currentPosition > MAX_SLIDE_DISTANCE) {
        // Don't allow pulling too far to the right
        gestureTranslateX.value = MAX_SLIDE_DISTANCE - translateX.value;
      } else if (currentPosition < -DRAWER_WIDTH) {
        // Don't allow pulling too far to the left
        gestureTranslateX.value = -DRAWER_WIDTH - translateX.value;
      } else {
        gestureTranslateX.value = translationX;
      }
    },
    onEnd: (event) => {
      const { velocityX } = event;
      const currentPosition = translateX.value + gestureTranslateX.value;
      const shouldOpen = currentPosition > -DRAWER_WIDTH / 2 || velocityX > 500;
      
      if (shouldOpen) {
        // Open the drawer with refined spring physics - more door-like
        translateX.value = withSpring(0, {
          damping: 28, // Higher damping for smoother, less bouncy motion
          stiffness: 75, // Lower stiffness for more controlled movement
          mass: 1.2, // Slightly heavier feel
        });
        
        drawerScale.value = withSpring(1, {
          damping: 25, // Consistent damping
          stiffness: 80, // Slightly lower stiffness
          mass: 1.0,
        });
        
        overlayOpacity.value = withTiming(0.6, { 
          duration: 350, // Longer duration
          easing: Easing.bezier(0.215, 0.61, 0.355, 1), // Smooth cubic-bezier
        });
        
        // Enhanced haptic feedback for opening
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        // Close the drawer with smooth, controlled motion - like a heavy sliding door
        translateX.value = withSpring(-DRAWER_WIDTH, {
          damping: 30, // Higher damping for controlled close
          stiffness: 70, // Lower stiffness for smoother motion
          mass: 1.3, // Heavier feel for closing
        });
        
        drawerScale.value = withSpring(0.95, {
          damping: 28, // Consistent damping
          stiffness: 75, // Consistent stiffness
          mass: 1.2,
        });
        
        overlayOpacity.value = withTiming(0, { 
          duration: 320, // Longer duration
          easing: Easing.bezier(0.42, 0, 0.58, 1), // Smooth ease-in-out
        }, (finished) => {
          if (finished) {
            runOnJS(onClose)();
          }
        });
        
        // Light haptic feedback for closing
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
      
      gestureTranslateX.value = 0;
    },
  });

  // Animated styles for smooth 120fps performance with perfect alignment
  const drawerAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: translateX.value + gestureTranslateX.value },
        { scale: drawerScale.value },
      ] as any,
      opacity: drawerOpacity.value,
    };
  });
  
  // Separate shadow style for better performance
  const drawerShadowStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      shadowOpacity: shadowOpacity.value,
      shadowRadius: shadowRadius.value,
      elevation: shadowOpacity.value * 20, // Reduced elevation for Android
    };
  });

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: overlayOpacity.value,
    };
  });

  // Modal animated styles
  const clearModalOverlayStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: clearOverlayOpacity.value,
    };
  });

  const clearModalContainerStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: clearContainerOpacity.value,
      transform: [{ scale: clearContainerScale.value }] as any,
    };
  });

  const trashAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: trashScale.value }] as any,
    };
  });

  const checkAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: checkOpacity.value,
    };
  });

  const deleteModalOverlayStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: deleteOverlayOpacity.value,
    };
  });

  const deleteModalContainerStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: deleteContainerOpacity.value,
      transform: [{ scale: deleteContainerScale.value }] as any,
    };
  });

  const deleteTrashAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: deleteTrashScale.value }] as any,
    };
  });

  const deleteCheckAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: deleteCheckOpacity.value,
    };
  });

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMs = now.getTime() - messageTime.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getFilteredConversations = (pageId: string) => {
    switch (pageId) {
      case 'recent':
        return conversations.slice(0, 10); // Recent 10 conversations
      case 'all':
        return conversations; // All conversations
      case 'favorites':
        // For now, return conversations with more than 10 messages as "favorites"
        return conversations.filter(conv => conv.messageCount > 10);
      default:
        return conversations;
    }
  };

  const renderConversationItem = ({ item, index }: { item: Conversation, index: number }) => {
    const isActive = item._id === currentConversationId;
    
    // Get a consistent pastel color for each conversation based on index
    const pastelColors = Object.values(designTokens.pastels);
    const dotColor = pastelColors[index % pastelColors.length];
    
    return (
      <TouchableOpacity
        onPress={() => handleConversationPress(item)}
        style={[
          styles.conversationCard, 
          { 
            marginBottom: 12,
            marginTop: index === 0 ? 16 : 0, // Add top margin to first item
          }
        ]}
        activeOpacity={0.8} // Match HeaderMenu press feedback
      >
        <View
          style={[
            styles.conversationBlur,
            {
              backgroundColor: isActive
                ? theme === 'dark' 
                  ? 'rgba(110, 231, 183, 0.15)'
                  : 'rgba(110, 231, 183, 0.25)'
                : theme === 'dark'
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(0, 0, 0, 0.03)',
              borderColor: isActive
                ? theme === 'dark'
                  ? 'rgba(110, 231, 183, 0.3)'
                  : 'rgba(110, 231, 183, 0.4)'
                : theme === 'dark'
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(0, 0, 0, 0.08)',
            }
          ]}
        >
          {/* Pastel dot for visual effect */}
          <View 
            style={[
              styles.pastelDot,
              { backgroundColor: dotColor }
            ]} 
          />
          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <Text style={[
                styles.conversationTitle,
                { color: themeColors.text }
              ]}>
                {item.title && item.title.trim() !== '' ? item.title : 'Untitled Conversation'}
              </Text>
              <Text style={[
                styles.conversationTime,
                { color: themeColors.textSecondary }
              ]}>
                {formatTimeAgo(item.lastActivity)}
              </Text>
            </View>
            
            {item.summary && (
              <Text style={[
                styles.conversationPreview,
                { color: themeColors.textMuted }
              ]}>
                {item.summary.length > 60 ? item.summary.substring(0, 60) + '...' : item.summary}
              </Text>
            )}
            
            <View style={styles.conversationMeta}>
              <Text style={[
                styles.messageCount,
                { color: themeColors.textSecondary }
              ]}>
                {item.messageCount} messages
              </Text>
              <View style={styles.metaRight}>
                {isActive && (
                  <View style={[
                    styles.activeIndicator,
                    { backgroundColor: theme === 'dark' ? '#6ee7b7' : '#10b981' }
                  ]} />
                )}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    handleDeleteConversation(item._id);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="dots-vertical"
                    size={20}
                    color={themeColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    return (
      <View style={[
        styles.header,
        {
          borderBottomColor: theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default,
        }
      ]}>
        <View style={styles.headerContent}>
          <Text style={[
            styles.headerTitle,
            { color: themeColors.text }
          ]}>
            {pages[currentPage].title}
          </Text>
          
          {/* Page Indicators */}
          <View style={styles.pageIndicators}>
            {pages.map((page, index) => (
              <TouchableOpacity
                key={page.id}
                style={[
                  styles.pageIndicator,
                  {
                    backgroundColor: index === currentPage 
                      ? (theme === 'dark' ? '#6ee7b7' : '#10b981')
                      : (theme === 'dark' ? designTokens.surfaces.dark.highlight : designTokens.surfaces.light.elevated),
                  }
                ]}
                onPress={() => navigateToPage(index)}
                activeOpacity={0.7}
              />
            ))}
          </View>
        </View>
        
        <View style={styles.headerButtons}>
          {onStartNewChat && (
            <TouchableOpacity
              style={[
                styles.newChatButton,
                {
                  backgroundColor: theme === 'dark' 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'rgba(255, 255, 255, 1)',
                  shadowOpacity: theme === 'dark' ? 0.2 : 0.08,
                }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                if (onStartNewChat) {
                  onStartNewChat();
                }
                onClose();
              }}
              activeOpacity={0.7}
            >
              <FontAwesome5 
                name="plus" 
                size={16} 
                color={theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary} 
              />
            </TouchableOpacity>
          )}
          {conversations.length > 0 && (
            <TouchableOpacity
              style={[
                styles.clearAllButton,
                {
                  backgroundColor: theme === 'dark' 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'rgba(255, 255, 255, 1)',
                  shadowOpacity: theme === 'dark' ? 0.2 : 0.08,
                }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                showClearAllModal();
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name="trash-can-outline" 
                size={16} 
                color={theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary} 
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.closeButton,
              {
                backgroundColor: theme === 'dark' 
                  ? 'rgba(255, 255, 255, 0.08)' 
                  : 'rgba(255, 255, 255, 1)',
                shadowOpacity: theme === 'dark' ? 0.2 : 0.08,
              }
            ]}
            onPress={allowInteraction ? handleOverlayPress : undefined}
            activeOpacity={0.7}
            disabled={!allowInteraction}
          >
            <FontAwesome5 
              name="times" 
              size={16} 
              color={theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <FontAwesome5 
        name="comments" 
        size={32} 
        color={theme === 'dark' ? '#444444' : '#cccccc'} 
        style={styles.emptyIcon}
      />
      <Text style={[
        styles.emptyText,
        { color: theme === 'dark' ? '#666666' : '#999999' }
      ]}>
        No conversations yet
      </Text>
    </View>
  );

  const renderPageContent = (pageId: string) => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../../assets/NuminaSpinner.json')}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorState}>
          <Icon name="alert-circle" size="xl" color="error" theme={theme} />
          <Text style={[styles.errorTitle, { color: themeColors.text }]}>
            Failed to load
          </Text>
          <Text style={[styles.errorSubtitle, { color: themeColors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: themeColors.primary }]}
            onPress={loadConversations}
          >
            <Text style={[styles.retryText, { color: themeColors.background }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    const pageConversations = getFilteredConversations(pageId);

    if (pageConversations.length === 0) {
      return renderEmptyState();
    }

    return (
      <FlatList
        data={pageConversations}
        renderItem={({ item, index }) => renderConversationItem({ item, index })}
        keyExtractor={(item) => item._id}
        style={styles.conversationsList}
        contentContainerStyle={styles.conversationsContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['transparent']}
            tintColor="transparent"
            progressBackgroundColor="transparent"
          />
        }
        ListEmptyComponent={renderEmptyState()}
      />
    );
  };

  const renderContent = () => {
    return (
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={(e) => handlePageChange(e.nativeEvent.position)}
        orientation="horizontal"
        scrollEnabled={true}
        keyboardDismissMode="on-drag"
      >
        {pages.map((page) => (
          <View key={page.id} style={styles.pageContainer}>
            {renderPageContent(page.id)}
          </View>
        ))}
      </PagerView>
    );
  };

  if (!isVisible) return null;

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          overlayAnimatedStyle,
          {
            backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
          },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          onPress={handleOverlayPress}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Drawer with Gesture Handler */}
      <PanGestureHandler
        onGestureEvent={gestureHandler}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-5, 5]}
      >
        <Animated.View
          style={[
            styles.drawer,
            drawerAnimatedStyle,
            drawerShadowStyle,
            getStandardBorder(theme),
            {
              backgroundColor: theme === 'dark' ? designTokens.surfaces.dark.elevated : themeColors.background,
              borderRightWidth: 1,
              borderLeftWidth: 0,
              borderTopWidth: 0,
              borderBottomWidth: 0,
            },
          ]}
        >
          {renderHeader()}
          {renderContent()}
        </Animated.View>
      </PanGestureHandler>

      {/* Clear All Confirmation Modal */}
      {showClearModal && (
        <Animated.View style={[
          styles.modalOverlay,
          clearModalOverlayStyle,
        ]}>
          <Animated.View style={[
            styles.modalContainer,
            clearModalContainerStyle,
            {
              backgroundColor: theme === 'dark' ? designTokens.surfaces.dark.elevated : '#add5fa',
              borderColor: theme === 'dark' 
                ? designTokens.borders.dark.default
                : 'rgba(255, 255, 255, 0.3)',
            }
          ]}>
            {clearStatus === 'idle' ? (
              <>
                <FontAwesome5 
                  name="exclamation-triangle" 
                  size={15} 
                  color={theme === 'dark' ? '#ff6b6b' : '#e53e3e'} 
                />
                
                <Text style={[
                  styles.modalTitle,
                  { color: theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary }
                ]}>
                  Clear All Conversations?
                </Text>
                
                <Text style={[
                  styles.modalMessage,
                  { color: theme === 'dark' ? '#d1d5db' : '#6b7280' }
                ]}>
                  This action cannot be undone. All conversation history will be permanently deleted.
                </Text>
                
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' }}>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      {
                        backgroundColor: theme === 'dark' ? designTokens.surfaces.dark.elevated : designTokens.surfaces.light.elevated,
                        flex: 1,
                      }
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      hideClearModal();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.modalButtonText,
                      { color: theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary }
                    ]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      {
                        backgroundColor: theme === 'dark' ? '#dc2626' : '#e53e3e',
                        flex: 1,
                      }
                    ]}
                    onPress={confirmClearAll}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.modalButtonText,
                      { color: designTokens.text.primaryDark }
                    ]}>
                      Clear All
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : clearStatus === 'deleting' ? (
              <>
                <Animated.View style={trashAnimatedStyle}>
                  <FontAwesome5 
                    name="trash-alt" 
                    size={15} 
                    color={theme === 'dark' ? '#dc2626' : '#e53e3e'} 
                  />
                </Animated.View>
                
                <ActivityIndicator 
                  size="small" 
                  color={theme === 'dark' ? '#6ec5ff' : '#4a5568'} 
                  style={{ marginTop: 16 }}
                />
                
                <Text style={[
                  styles.modalTitle,
                  { color: theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary }
                ]}>
                  Deleting from Database...
                </Text>
                
                <Text style={[
                  styles.modalMessage,
                  { color: theme === 'dark' ? '#d1d5db' : '#6b7280' }
                ]}>
                  Please wait while we permanently delete all conversations
                </Text>
                
                <View style={{ height: 68, marginTop: 24 }} />
              </>
            ) : clearStatus === 'success' ? (
              <>
                <Animated.View
                  style={[
                    checkAnimatedStyle,
                    { position: 'relative', top: 0 }
                  ]}
                >
                  <FontAwesome5 
                    name="check-circle" 
                    size={15} 
                    color={theme === 'dark' ? '#10b981' : '#059669'} 
                  />
                </Animated.View>
                
                <Text style={[
                  styles.modalTitle,
                  { color: theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary }
                ]}>
                  Conversations Cleared
                </Text>
                
                <Text style={[
                  styles.modalMessage,
                  { color: theme === 'dark' ? '#d1d5db' : '#6b7280' }
                ]}>
                   Database confirmed: All conversation history deleted
                </Text>
                
                <View style={{ height: 68, marginTop: 24 }} />
              </>
            ) : (
              <>
                <FontAwesome5 
                  name="times-circle" 
                  size={15} 
                  color={theme === 'dark' ? '#dc2626' : '#e53e3e'} 
                />
                
                <Text style={[
                  styles.modalTitle,
                  { color: theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary }
                ]}>
                  Deletion Failed
                </Text>
                
                <Text style={[
                  styles.modalMessage,
                  { color: theme === 'dark' ? '#d1d5db' : '#6b7280' }
                ]}>
                   Database error: Failed to delete conversations
                </Text>
                
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor: theme === 'dark' ? designTokens.surfaces.dark.elevated : designTokens.surfaces.light.elevated,
                      marginTop: 24,
                      width: '100%',
                    }
                  ]}
                  onPress={hideClearModal}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.modalButtonText,
                    { color: theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary }
                  ]}>
                    Close
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </Animated.View>
      )}

      {/* Delete Single Conversation Modal */}
      {showDeleteModal && (
        <Animated.View style={[
          styles.modalOverlay,
          deleteModalOverlayStyle,
        ]}>
          <Animated.View style={[
            styles.modalContainer,
            deleteModalContainerStyle,
            {
              backgroundColor: theme === 'dark' ? designTokens.surfaces.dark.elevated : '#add5fa',
              borderColor: theme === 'dark' 
                ? designTokens.borders.dark.default
                : 'rgba(255, 225, 255, 0.3)',
            }
          ]}>
            {deleteStatus === 'idle' ? (
              <>
                <FontAwesome5 
                  name="exclamation-triangle" 
                  size={15} 
                  color={theme === 'dark' ? '#ff6b6b' : '#e53e3e'} 
                />
                
                <Text style={[
                  styles.modalTitle,
                  { color: theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary }
                ]}>
                  Delete Conversation?
                </Text>
                
                <Text style={[
                  styles.modalMessage,
                  { color: theme === 'dark' ? '#d1d5db' : '#6b7280' }
                ]}>
                  This action cannot be undone. This conversation will be permanently deleted.
                </Text>
                
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' }}>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      {
                        backgroundColor: theme === 'dark' ? designTokens.surfaces.dark.elevated : designTokens.surfaces.light.elevated,
                        flex: 1,
                      }
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      hideDeleteModal();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.modalButtonText,
                      { color: theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary }
                    ]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      {
                        backgroundColor: theme === 'dark' ? '#dc2626' : '#e53e3e',
                        flex: 1,
                      }
                    ]}
                    onPress={confirmDeleteConversation}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.modalButtonText,
                      { color: designTokens.text.primaryDark }
                    ]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : deleteStatus === 'deleting' ? (
              <>
                <Animated.View style={deleteTrashAnimatedStyle}>
                  <FontAwesome5 
                    name="trash-alt" 
                    size={15} 
                    color={theme === 'dark' ? '#dc2626' : '#e53e3e'} 
                  />
                </Animated.View>
                
                <ActivityIndicator 
                  size="small" 
                  color={theme === 'dark' ? '#6ec5ff' : '#4a5568'} 
                  style={{ marginTop: 16 }}
                />
                
                <Text style={[
                  styles.modalTitle,
                  { color: theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary }
                ]}>
                  Deleting from Database...
                </Text>
                
                <Text style={[
                  styles.modalMessage,
                  { color: theme === 'dark' ? '#d1d5db' : '#6b7280' }
                ]}>
                  Please wait while we permanently delete this conversation
                </Text>
                
                <View style={{ height: 68, marginTop: 24 }} />
              </>
            ) : deleteStatus === 'success' ? (
              <>
                <Animated.View
                  style={[
                    deleteCheckAnimatedStyle,
                    { position: 'relative', top: 0 }
                  ]}
                >
                  <FontAwesome5 
                    name="check-circle" 
                    size={15} 
                    color={theme === 'dark' ? '#10b981' : '#059669'} 
                  />
                </Animated.View>
                
                <Text style={[
                  styles.modalTitle,
                  { color: theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary }
                ]}>
                  Conversation Deleted
                </Text>
                
                <Text style={[
                  styles.modalMessage,
                  { color: theme === 'dark' ? '#d1d5db' : '#6b7280' }
                ]}>
                   Database confirmed: Conversation permanently deleted
                </Text>
                
                <View style={{ height: 68, marginTop: 24 }} />
              </>
            ) : (
              <>
                <FontAwesome5 
                  name="times-circle" 
                  size={15} 
                  color={theme === 'dark' ? '#dc2626' : '#e53e3e'} 
                />
                
                <Text style={[
                  styles.modalTitle,
                  { color: theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary }
                ]}>
                  Deletion Failed
                </Text>
                
                <Text style={[
                  styles.modalMessage,
                  { color: theme === 'dark' ? '#d1d5db' : '#6b7280' }
                ]}>
                   Database error: Failed to delete conversation
                </Text>
                
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor: theme === 'dark' ? designTokens.surfaces.dark.elevated : designTokens.surfaces.light.elevated,
                      marginTop: 24,
                      width: '100%',
                    }
                  ]}
                  onPress={hideDeleteModal}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.modalButtonText,
                    { color: theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary }
                  ]}>
                    Close
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </Animated.View>
      )}

    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },

  // Overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTouchable: {
    flex: 1,
  },

  // Drawer - Optimized for silk-smooth animations
  drawer: {
    position: 'absolute',
    top: DRAWER_TOP_MARGIN,
    left: 0,
    height: DRAWER_HEIGHT,
    width: DRAWER_WIDTH,
    borderTopRightRadius: 28, // Slightly larger radius for premium feel
    borderBottomRightRadius: 28,
    elevation: 0, // Will be controlled by animated shadow
    shadowColor: designTokens.surfaces.light.shadow,
    shadowOffset: { width: 8, height: 0 }, // Horizontal shadow for slide effect
    shadowOpacity: 0, // Will be controlled by animation
    shadowRadius: 0, // Will be controlled by animation
  },
  drawerContent: {
    flex: 1,
  },

  // Header - Perfect alignment with ChatScreen header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: 68, // Precisely aligned with ChatScreen header position
    borderBottomWidth: 1,
    overflow: 'hidden',
    minHeight: 88, // Matches ChatScreen header height
  },
  headerContent: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 28,
    marginLeft: 0,
    marginBottom: 0,
    flex: 1,
    flexShrink: 1,
  },
  headerSubtitle: {
    ...typography.textStyles.caption,
  },
  closeButton: {
    width: 44, // Matches ChatScreen header button size exactly
    height: 44,
    borderRadius: 12, // Matches ChatScreen header button radius
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0,
    borderWidth: 0,
    overflow: 'hidden',
    shadowColor: designTokens.surfaces.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },

  // Conversations List
  conversationsList: {
    flex: 1,
    paddingHorizontal: spacing[3],
  },
  conversationsContent: {
    paddingBottom: spacing[4],
    gap: spacing[1],
  },

  // Conversation Item
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[3],
    borderRadius: 12,
    marginBottom: spacing[2],
  },
  conversationContent: {
    flex: 1,
    marginRight: spacing[3],
  },
  conversationTitle: {
    ...typography.textStyles.bodyLarge,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  conversationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  conversationTime: {
    ...typography.textStyles.caption,
  },
  conversationStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  messageCount: {
    ...typography.textStyles.caption,
  },
  conversationSummary: {
    ...typography.textStyles.bodySmall,
    lineHeight: 18,
  },

  // States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 60,
    height: 60,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  loadingText: {
    ...typography.textStyles.bodyMedium,
    textAlign: 'center',
  },

  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  errorTitle: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtitle: {
    ...typography.textStyles.bodyMedium,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 12,
    marginTop: spacing[2],
  },
  retryText: {
    ...typography.textStyles.labelMedium,
    fontWeight: '600',
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  emptyTitle: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.textStyles.bodyMedium,
    textAlign: 'center',
  },

  // Missing styles
  conversationCard: {
    borderRadius: 12,
    marginHorizontal: spacing[1],
    marginVertical: 2,
    overflow: 'hidden',
  },
  conversationBlur: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1], // Further reduced from spacing[2] to spacing[1]
    borderWidth: 1,
    position: 'relative',
  },
  pastelDot: {
    position: 'absolute',
    top: 8, // Adjusted for shorter card height
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.7,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[1], // Reduced from spacing[2] to spacing[1]
  },
  conversationPreview: {
    ...typography.textStyles.bodySmall,
    marginBottom: spacing[1], // Reduced from spacing[2] to spacing[1]
    lineHeight: 18,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deleteButton: {
    padding: spacing[1],
    borderRadius: 6,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Matches ChatScreen header button spacing exactly
    flexShrink: 0,
  },
  newChatButton: {
    width: 44, // Matches ChatScreen header button size exactly
    height: 44,
    borderRadius: 12, // Matches ChatScreen header button radius
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    overflow: 'hidden',
    shadowColor: designTokens.surfaces.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  clearAllButton: {
    width: 44, // Matches ChatScreen header button size exactly
    height: 44,
    borderRadius: 12, // Matches ChatScreen header button radius
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    overflow: 'hidden',
    shadowColor: designTokens.surfaces.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  emptyIcon: {
    marginBottom: spacing[3],
  },
  emptyText: {
    ...typography.textStyles.bodyLarge,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: '80%',
    maxWidth: 300,
    padding: spacing[5],
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalTitle: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing[3],
  },
  modalMessage: {
    ...typography.textStyles.bodyMedium,
    textAlign: 'center',
    marginTop: spacing[2],
  },
  modalButton: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    ...typography.textStyles.labelMedium,
    fontWeight: '600',
  },
  
  // Pager styles
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  pageIndicators: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  pageIndicator: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },
});

export default ConversationDrawer;