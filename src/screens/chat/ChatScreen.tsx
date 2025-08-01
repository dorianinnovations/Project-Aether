/**
 * Numina - Adaptive Chat Screen
 * The heart of Numina - AI that learns and adapts to your patterns
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Animated,
  Alert,
  Text,
  Dimensions,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

// Enhanced Components
import { EnhancedChatInput } from '../../design-system/components/molecules';
import EnhancedBubble from '../../design-system/components/molecules/EnhancedBubble';
import { Header, HeaderMenu, SignOutModal } from '../../design-system/components/organisms';
import { PageBackground } from '../../design-system/components/atoms/PageBackground';
import SettingsModal from './SettingsModal';
import ConversationDrawer from '../../components/ConversationDrawer';
import ScrollToBottomButton from '../../design-system/components/atoms/ScrollToBottomButton';
import Tooltip from '../../design-system/components/atoms/Tooltip';
import { ShimmerText } from '../../design-system/components/atoms/ShimmerText';

// Design System
import { designTokens, getThemeColors, getLoadingTextColor } from '../../design-system/tokens/colors';

// Contexts
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import { typography } from '../../design-system/tokens/typography';
import { spacing } from '../../design-system/tokens/spacing';
import { createNeumorphicContainer } from '../../design-system/tokens/shadows';
import { getGlassmorphicStyle } from '../../design-system/tokens/glassmorphism';
import Icon from '../../design-system/components/atoms/Icon';
import { useHeaderMenu } from '../../design-system/hooks';


// Services
import { ChatAPI, ApiUtils, ConversationAPI, AuthAPI, TokenManager } from '../../services/api';

// Types
import { ToolCall } from '../../types';

interface Message {
  id: string;
  sender: 'user' | 'numina' | 'system';
  message: string;
  timestamp: string;
  variant?: 'default' | 'streaming' | 'error' | 'tool';
  metadata?: {
    toolUsed?: string;
    toolCalls?: ToolCall[];
    confidence?: number;
    processingTime?: number;
  };
}

interface ChatScreenProps {}

const { height: screenHeight } = Dimensions.get('window');

// Helper function to detect and create tool calls from message content
// DISABLED: Tool calls should come from the backend API, not client-side detection
const detectToolUsage = (messageContent: string): ToolCall[] => {
  // Completely disabled to prevent false positives during normal chat
  // Tool calls should be provided by the backend API response
  return [];
};

const ChatScreen: React.FC<ChatScreenProps> = () => {
  const navigation = useNavigation();
  const { theme, colors, toggleTheme } = useTheme();
  const { settings } = useSettings();
  
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Enhanced UI state
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  
  
  // Dynamic greeting state
  const [userName, setUserName] = useState<string>('');
  const [greetingText, setGreetingText] = useState<string>('');
  const [showGreeting, setShowGreeting] = useState<boolean>(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Animation refs for dynamic greeting
  const greetingAnimY = useRef(new Animated.Value(0)).current;
  const greetingOpacity = useRef(new Animated.Value(1)).current;

  // Header menu hook
  const { showHeaderMenu, setShowHeaderMenu, handleMenuAction, toggleHeaderMenu } = useHeaderMenu({
    screenName: 'chat',
    onSettingsPress: () => setShowSettings(true),
    onSignOut: () => setShowSignOutModal(true)
  });

  // Simple refs for basic functionality
  const flatListRef = useRef<FlatList>(null);
  const headerAnim = useRef(new Animated.Value(1)).current;

  // Smart suggestions based on context
  const [suggestions] = useState([
    "How are you feeling today?",
    "Help me understand my patterns",
    "What can you tell me about myself?",
    "Show me my behavioral insights",
    "Find me connections with similar interests",
  ]);

  // Initialize dynamic greeting
  useEffect(() => {
    const initializeGreeting = async () => {
      try {
        const userData = await TokenManager.getUserData();
        const firstName = userData?.name?.split(' ')[0] || 'User';
        setUserName(firstName);
        
        // Get time-based greeting with proper time ranges
        const hour = new Date().getHours();
        let timeGreeting;
        
        if (hour >= 5 && hour < 12) {
          timeGreeting = 'Good Morning';
        } else if (hour >= 12 && hour < 17) {
          timeGreeting = 'Good Afternoon';
        } else {
          timeGreeting = 'Good Evening';
        }
        
        setGreetingText(`${timeGreeting}, ${firstName}`);
      } catch (error) {
        // Fallback with current time-based greeting
        const hour = new Date().getHours();
        let timeGreeting;
        
        if (hour >= 5 && hour < 12) {
          timeGreeting = 'Good Morning';
        } else if (hour >= 12 && hour < 17) {
          timeGreeting = 'Good Afternoon';
        } else {
          timeGreeting = 'Good Evening';
        }
        
        setGreetingText(`${timeGreeting}, User`);
      }
    };
    
    initializeGreeting();
  }, []);

  // Keyboard animation listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener('keyboardWillShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      // Ultra-smooth spring animation for 120fps-like movement
      Animated.parallel([
        Animated.spring(greetingAnimY, {
          toValue: -120,
          tension: 300,
          friction: 25,
          useNativeDriver: true,
        }),
        Animated.timing(greetingOpacity, {
          toValue: 0.7,
          duration: 200,
          easing: Easing.bezier(0.23, 1, 0.32, 1), // Ultra-smooth easeOutQuart
          useNativeDriver: true,
        })
      ]).start();
    });

    const keyboardWillHide = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
      // Ultra-smooth spring animation back down with gentle settling
      Animated.parallel([
        Animated.spring(greetingAnimY, {
          toValue: 0,
          tension: 280,
          friction: 30,
          useNativeDriver: true,
        }),
        Animated.timing(greetingOpacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.bezier(0.165, 0.84, 0.44, 1), // Ultra-smooth easeOutQuart
          useNativeDriver: true,
        })
      ]).start();
    });

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [greetingAnimY, greetingOpacity]);

  // RESPONSIVE: Enhanced scroll logic for fast streaming
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTimeRef = useRef(0);
  
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const streaming = lastMessage.variant === 'streaming';
      
      setIsStreaming(streaming);
      
      // Enhanced scroll logic for fast streaming
      if (streaming) {
        const now = Date.now();
        const timeSinceLastScroll = now - lastScrollTimeRef.current;
        
        // Clear any pending scroll
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Immediate scroll for first word or if enough time has passed
        if (timeSinceLastScroll > 100) {
          flatListRef.current?.scrollToEnd({ animated: true });
          lastScrollTimeRef.current = now;
        } else {
          // Throttled scroll for rapid updates - shorter delay for responsiveness
          scrollTimeoutRef.current = setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
            lastScrollTimeRef.current = Date.now();
          }, 15); // Much more responsive - matches streaming speed
        }
      }
    } else {
      setIsStreaming(false);
    }
  }, [messages]);
  
  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  
  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);
  
  // Conversation drawer state
  const [showConversationDrawer, setShowConversationDrawer] = useState(false);

  // Handle sending message
  const handleSend = async () => {
    // Allow sending if there's text OR attachments
    if ((!inputText.trim() && attachments.length === 0) || isLoading) return;

    // Hide greeting on first message
    if (showGreeting) {
      setShowGreeting(false);
    }

    // Prepare message text - use input text or default for photo-only messages
    const messageText = inputText.trim() || (attachments.length > 0 ? "📸 Photo" : "");
    
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      message: messageText,
      timestamp: new Date().toISOString(),
    };

    // Add user message - scroll will be handled by useEffect
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

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
      
      for await (const chunk of ChatAPI.streamMessageWords(messageText, '/ai/adaptive-chat', attachments)) {
        // For word animation, each chunk is a complete word - add with space
        accumulatedText += (accumulatedText ? ' ' : '') + chunk;
        wordCount++;
        
        // Update the streaming message while keeping streaming variant
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessage.id 
            ? { ...msg, message: accumulatedText, variant: 'streaming', timestamp: new Date().toISOString() }
            : msg
        ));
      }
      
      // Mark as complete
      setMessages(prev => prev.map(msg => 
        msg.id === streamingMessage.id 
          ? { ...msg, variant: 'default' }
          : msg
      ));
      
      setAttachments([]);
      
      // Sync haptic with final word's opacity animation completion
      // Final word delay: (wordCount-1) * 15ms + 80ms duration - back to original
      const finalWordAnimationTime = Math.max(0, (wordCount - 1) * 15) + 80;
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, finalWordAnimationTime);

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

  // Handle suggestion press
  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
  };

  // Handle settings press
  const handleSettingsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSettings(true);
  };

  // Handle conversation history press
  const handleConversationHistoryPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowConversationDrawer(true);
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
        // No auto-scroll for demos
        return;
      }
      
      // Load the full conversation from server with max allowed messages (500)
      const fullConversation = await ConversationAPI.getConversation(conversation._id, 500);
      
      // Debug logging
      console.log('Loading conversation:', conversation._id);
      console.log('Full conversation response:', fullConversation);
      console.log('Messages in response:', fullConversation.messages?.length || 0);
      
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
      
      console.log('Converted messages count:', convertedMessages.length);
      console.log('Sample converted messages:', convertedMessages.slice(0, 3));
      
      // Replace current messages with loaded conversation
      setMessages(convertedMessages);
      // No auto-scroll for loaded conversations
      
    } catch (error: any) {
      console.error('Failed to load conversation:', error);
      console.error('Error details:', {
        status: error.status,
        message: error.message,
        response: error.response?.data
      });
      
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

  // Handle message actions - instant copy to clipboard
  const handleMessagePress = async (message: Message) => {
    if (message.message && message.message.trim()) {
      try {
        await Clipboard.setStringAsync(message.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowCopyTooltip(true);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  // Keep long press for metadata viewing (Numina messages only)
  const handleMessageLongPress = (message: Message) => {
    if (message.sender === 'numina' && message.metadata) {
      // Show message details
      Alert.alert(
        'Message Details',
        `Processing Time: ${message.metadata.processingTime}ms\nConfidence: ${(message.metadata.confidence || 0) * 100}%${message.metadata.toolUsed ? `\nTool Used: ${message.metadata.toolUsed}` : ''}`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  // Handle scroll to bottom button press
  const handleScrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  // Enhanced handlers for new components
  // Note: handleMenuAction now provided by useHeaderMenu hook

  const handleSignOut = async () => {
    try {
      console.log('Signing out...');
      setShowSignOutModal(false);
      await AuthAPI.logout();
      // Auth check in App.tsx will handle navigation automatically
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleVoiceStart = () => {
    setIsVoiceRecording(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleVoiceEnd = () => {
    setIsVoiceRecording(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Add voice processing logic here
  };

  const handleEnhancedSend = (attachments?: any[]) => {
    if (attachments && attachments.length > 0) {
      // Handle attachments
      console.log('Sending with attachments:', attachments);
    }
    handleSend();
  };


  // Render message item
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    // Transform the message format for message bubble
    const enhancedMessage = {
      id: item.id,
      text: item.message,
      sender: item.sender,
      timestamp: item.timestamp,
      variant: item.variant,
      isStreaming: item.variant === 'streaming',
      isSystem: item.sender === 'system',
      metadata: item.metadata,
    };
    
    // Use the enhanced bubble with word animation
    const MessageComponent = EnhancedBubble;

    return (
      <MessageComponent
        key={item.id}
        message={enhancedMessage}
        index={index}
        theme={theme}
        messageIndex={index}
        colorfulBubblesEnabled={settings.colorfulBubblesEnabled}
        onLongPress={() => handleMessageLongPress(item)}
        onSpeakMessage={(text) => console.log('Speak:', text)}
      />
    );
  };

  // Chat header with status
  const renderHeader = () => {
    const glassmorphicHeader = getGlassmorphicStyle('header', theme as 'light' | 'dark');
    
    return (
      <Animated.View style={[
        styles.header,
        glassmorphicHeader,
        { opacity: headerAnim }
      ]}>
        {/* Left side - AI Status and Title */}
        <View style={styles.headerLeft}>
          <View style={styles.aiStatus}>
            <View style={[styles.statusDot, { 
              backgroundColor: isLoading 
                ? designTokens.brand.accent 
                : designTokens.semantic.success 
            }]} />
            <Text style={[
              styles.headerTitle, 
              { color: isLoading ? getLoadingTextColor(theme, 'primary') : colors.text }
            ]}>
              Numina
            </Text>
          </View>
          
          <Text style={[
            styles.headerSubtitle, 
            { color: isLoading ? getLoadingTextColor(theme, 'primary') : colors.textSecondary }
          ]}>
            {isLoading 
              ? 'Thinking...' 
              : `${messages.length - 1} messages • Learning your patterns`}
          </Text>
        </View>
        
        {/* Right side - Action Buttons */}
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleConversationHistoryPress}
            activeOpacity={0.7}
          >
            <Icon 
              name="message-square" 
              size="md" 
              color="muted"
              theme={theme}
            />
          </TouchableOpacity>
          
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleSettingsPress}
            activeOpacity={0.7}
          >
            <Icon 
              name="settings" 
              size="md" 
              color="muted"
              theme={theme}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <PageBackground theme={theme} variant="chat">
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
          backgroundColor="transparent"
          translucent
        />

        {/* Dynamic Greeting Banner */}
        {greetingText && showGreeting && (
          <Animated.View 
            style={[
              styles.greetingBanner,
              {
                transform: [{ translateY: greetingAnimY }],
                opacity: greetingOpacity,
              }
            ]}
          >
            <ShimmerText 
              style={{
                ...styles.greetingText,
                color: theme === 'dark' ? colors.text : '#5A5A5A',
              }}
              intensity="subtle"
              duration={3000}
              waveWidth="wide"
              enabled={true}
            >
              {greetingText}
            </ShimmerText>
          </Animated.View>
        )}
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={15}
          updateCellsBatchingPeriod={50}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: headerAnim } } }],
            { 
              useNativeDriver: false,
              listener: (event: any) => {
                // Handle header animation
                const offsetY = event.nativeEvent.contentOffset.y;
                headerAnim.setValue(offsetY > 50 ? 0.8 : 1);
              }
            }
          )}
          scrollEventThrottle={16}
        />
        
        <ScrollToBottomButton
          visible={false}
          onPress={handleScrollToBottom}
          theme={theme}
        />
        
        <Tooltip
          visible={showCopyTooltip}
          text="Copied to clipboard"
          theme={theme}
          onHide={() => setShowCopyTooltip(false)}
        />
        

        <EnhancedChatInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleEnhancedSend}
          onVoiceStart={handleVoiceStart}
          onVoiceEnd={handleVoiceEnd}
          isLoading={isLoading}
          theme={theme}
          placeholder="What up?"
          nextMessageIndex={messages.length}
          voiceEnabled={true}
          enableFileUpload={true}
          maxAttachments={5}
          attachments={attachments}
          onAttachmentsChange={setAttachments}
          colorfulBubblesEnabled={settings.colorfulBubblesEnabled}
          onFocus={() => {
            // Scroll to bottom when input is focused
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
        />
      </KeyboardAvoidingView>
      
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onSignOut={async () => {
          try {
            await AuthAPI.logout();
            // Auth check in App.tsx will handle navigation automatically
          } catch (error) {
            console.error('Sign out error:', error);
          }
        }}
        navigation={navigation}
      />
      
      <ConversationDrawer
        isVisible={showConversationDrawer}
        onClose={() => setShowConversationDrawer(false)}
        onConversationSelect={handleConversationSelect}
        theme={theme}
      />
      
      {/* Enhanced Header */}
      <Header
        title="Numina"
        showMenuButton={true}
        showConversationsButton={true}
        onMenuPress={toggleHeaderMenu}
        onConversationsPress={() => setShowConversationDrawer(true)}
        theme={theme}
        isVisible={headerVisible}
        isMenuOpen={showHeaderMenu}
      />
      
      {/* Header Menu */}
      <HeaderMenu
        visible={showHeaderMenu}
        onClose={() => {
          if (setShowHeaderMenu) {
            setShowHeaderMenu(false);
          }
        }}
        onAction={handleMenuAction}
        showAuthOptions={true}
      />
      
      {/* Sign Out Modal */}
      <SignOutModal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleSignOut}
        theme={theme}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="danger"
      />
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  keyboardContainer: {
    flex: 1,
  },

  // Dynamic Greeting Banner
  greetingBanner: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    transform: [{ translateY: -12 }], // Offset to account for text height
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    letterSpacing: -0.3,
    textAlign: 'center',
  },

  // Header
  header: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    marginHorizontal: spacing[3],
    marginTop: spacing[1],
    marginBottom: spacing[2],
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 64,
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[2],
  },
  headerTitle: {
    ...typography.textStyles.bodySmall,
    fontWeight: '400',
    fontSize: 11,
    textAlign: 'left',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    ...typography.textStyles.caption,
    fontSize: 9,
    textAlign: 'left',
    fontWeight: '400',
    letterSpacing: 0.3,
    opacity: 0.7,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  headerButton: {
    padding: spacing[2],
    borderRadius: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Messages
  messagesList: {
    flex: 1,
    paddingHorizontal: spacing[3],
    zIndex: 1, // Ensure messages appear above background but below header
  },
  messagesContent: {
    paddingTop: Platform.OS === 'ios' ? 100 : 80, // Account for absolute positioned header
    paddingBottom: 140, // Account for chat input + potential tab bar
    gap: spacing[2],
  },
});

export default ChatScreen;