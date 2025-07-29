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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

// Enhanced Components
import { EnhancedMessageBubble, EnhancedChatInput } from '../../design-system/components/molecules';
import { Header, HeaderMenu, SignOutModal } from '../../design-system/components/organisms';
import { PageBackground } from '../../design-system/components/atoms/PageBackground';
import SettingsModal from './SettingsModal';
import ConversationDrawer from '../../components/ConversationDrawer';
import ScrollToBottomButton from '../../design-system/components/atoms/ScrollToBottomButton';
import Tooltip from '../../design-system/components/atoms/Tooltip';

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
import { ChatAPI, ApiUtils, ConversationAPI, AuthAPI } from '../../services/api';

// Types
interface Message {
  id: string;
  sender: 'user' | 'numina' | 'system';
  message: string;
  timestamp: string;
  variant?: 'default' | 'streaming' | 'error' | 'tool';
  metadata?: {
    toolUsed?: string;
    confidence?: number;
    processingTime?: number;
  };
}

interface ChatScreenProps {}

const { height: screenHeight } = Dimensions.get('window');

const ChatScreen: React.FC<ChatScreenProps> = () => {
  const navigation = useNavigation();
  const { theme, colors, toggleTheme } = useTheme();
  const { settings } = useSettings();
  
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  
  // Enhanced UI state
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);

  // Header menu hook
  const { showHeaderMenu, setShowHeaderMenu, handleMenuAction, toggleHeaderMenu } = useHeaderMenu({
    screenName: 'chat',
    onSettingsPress: () => setShowSettings(true),
    onSignOut: () => setShowSignOutModal(true)
  });

  // Using colors from theme context instead of getThemeColors
  const flatListRef = useRef<any>(null);
  const headerAnim = useRef(new Animated.Value(1)).current;
  const scrollOffsetY = useRef(0);

  // Smart suggestions based on context
  const [suggestions] = useState([
    "How are you feeling today?",
    "Help me understand my patterns",
    "What can you tell me about myself?",
    "Show me my behavioral insights",
    "Find me connections with similar interests",
  ]);

  // Initialize with welcome message
  useEffect(() => {
        const welcomeMessage: Message = {
      id: 'welcome',
      sender: 'numina',
      message: "Hello! I'm Numina, your adaptive companion. I learn from our conversations to understand your unique patterns and preferences. What would you like to explore today?",
      timestamp: new Date().toISOString(),
      variant: 'default',
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Streaming message state
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  
  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);
  
  // Conversation drawer state
  const [showConversationDrawer, setShowConversationDrawer] = useState(false);

  // Handle sending message
  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      message: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    const messageText = inputText.trim();
    setInputText('');
    setIsLoading(true);
    setIsTyping(true);

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      sender: 'numina',
      message: '',
      timestamp: '',
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      // No artificial delays - start streaming immediately!

      // Send to AI with real SSE streaming
      const startTime = Date.now();
      
      // Remove typing indicator and create streaming message
      const streamingMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'numina',
        message: '',
        timestamp: new Date().toISOString(),
        variant: 'streaming',
        metadata: {
          confidence: 0.95,
        },
      };

      setMessages(prev => [
        ...prev.filter(msg => msg.id !== 'typing'),
        streamingMsg
      ]);
      setStreamingMessage(streamingMsg);

      // Real SSE streaming - as fast as server sends!
      let accumulatedText = '';
      let hasReceivedData = false;
      
      try {
        for await (const chunk of ChatAPI.streamMessage(messageText)) {
          hasReceivedData = true;
          accumulatedText += chunk;
          
          setMessages(prev => prev.map(msg => 
            msg.id === streamingMsg.id 
              ? { ...msg, message: accumulatedText }
              : msg
          ));
        }
      } catch (streamError) {
        // If streaming failed and we haven't received any data, try non-streaming
        if (!hasReceivedData) {
          try {
            const fallbackResponse = await ChatAPI.sendMessage(messageText, false);
            accumulatedText = fallbackResponse.content;
            
            setMessages(prev => prev.map(msg => 
              msg.id === streamingMsg.id 
                ? { ...msg, message: accumulatedText }
                : msg
            ));
          } catch (fallbackError) {
            throw streamError; // Re-throw original streaming error
          }
        } else {
          throw streamError; // Re-throw if we had partial streaming data
        }
      }

      // Mark as complete
      const processingTime = Date.now() - startTime;
      setMessages(prev => prev.map(msg => 
        msg.id === streamingMsg.id 
          ? { 
              ...msg, 
              variant: 'default',
              metadata: {
                ...msg.metadata,
                processingTime,
              }
            }
          : msg
      ));

      setStreamingMessage(null);
      
      // Haptic feedback for successful response
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (error: any) {
      console.error('Chat Error:', error);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'numina',
        message: `I apologize, but I encountered an error: ${ApiUtils.getErrorMessage(error)}. Please try again.`,
        timestamp: new Date().toISOString(),
        variant: 'error',
      };

      setMessages(prev => [...prev, errorMessage]);
      
      // Haptic feedback for error
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
    } finally {
      setIsLoading(false);
      setIsTyping(false);
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
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
        return;
      }
      
      // Load the full conversation from server
      const fullConversation = await ConversationAPI.getConversation(conversation._id);
      
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
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error: any) {
      console.error('Failed to load conversation:', error);
      
      if (error.status === 401) {
        Alert.alert(
          'Authentication Required',
          'Please sign in to load your conversation history.',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to load conversation. Please try again.',
          [{ text: 'OK', style: 'default' }]
        );
      }
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

  // Handle scroll to bottom
  const handleScrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setShowScrollToBottom(false);
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
    // Transform the message format for EnhancedMessageBubble
    const enhancedMessage = {
      id: item.id,
      text: item.message,
      sender: item.sender,
      timestamp: item.timestamp,
      isStreaming: item.variant === 'streaming',
      isSystem: item.sender === 'system',
      metadata: item.metadata,
    };


    return (
      <EnhancedMessageBubble
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
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: headerAnim } } }],
            { 
              useNativeDriver: false,
              listener: (event: any) => {
                const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                const offsetY = contentOffset.y;
                
                // Update header animation
                headerAnim.setValue(offsetY > 50 ? 0.8 : 1);
                
                // Track scroll position for scroll-to-bottom button
                scrollOffsetY.current = offsetY;
                
                // Show scroll-to-bottom button if not near bottom (150px threshold)
                const isNearBottom = offsetY + layoutMeasurement.height >= contentSize.height - 150;
                setShowScrollToBottom(!isNearBottom && messages.length > 3);
              }
            }
          )}
          scrollEventThrottle={16}
        />
        
        <ScrollToBottomButton
          visible={showScrollToBottom}
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
        isActive={isLoading || isTyping}
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