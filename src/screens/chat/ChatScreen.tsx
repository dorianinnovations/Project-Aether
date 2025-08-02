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
import { EnhancedChatInput, ChatHeader } from '../../design-system/components/molecules';
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

// Custom hooks
import { useGreeting } from '../../hooks/useGreeting';
import { useKeyboardAnimation } from '../../hooks/useKeyboardAnimation';
import { useMessages } from '../../hooks/useMessages';
import { useDynamicPrompts } from '../../hooks/useDynamicPrompts';
import { useNaturalScroll } from '../../hooks/useNaturalScroll';

// Services
import { AuthAPI } from '../../services/api';

// Utils
import { 
  createModalAnimationRefs, 
  showModalAnimation, 
  hideModalAnimation, 
  createTooltipPressAnimation,
  type ModalAnimationRefs 
} from '../../utils/animations';

// Types
import { ToolCall } from '../../types';


interface ChatScreenProps {}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ChatScreen: React.FC<ChatScreenProps> = () => {
  const navigation = useNavigation();
  const { theme, colors, toggleTheme } = useTheme();
  const { settings } = useSettings();
  
  // Custom hooks
  const { greetingText, showGreeting, setShowGreeting } = useGreeting();
  const { keyboardHeight, greetingAnimY, greetingOpacity } = useKeyboardAnimation();
  const {
    messages,
    isLoading,
    isStreaming,
    handleSend: handleMessageSend,
    handleMessagePress,
    handleMessageLongPress,
    handleConversationSelect,
    flatListRef: messagesRef,
  } = useMessages(() => setShowGreeting(false));

  // Natural scroll behavior hook
  const {
    flatListRef,
    handleScroll,
    scrollToBottom,
    snapToUserMessage,
    scrollToBottomOnKeyboard,
    getScrollState,
  } = useNaturalScroll({
    messages,
    isStreaming,
    onUserScrollUp: (isScrolledUp) => {
      // Could update UI to show scroll-to-bottom button when user scrolls up
    },
    onKeyboardShow: () => {
      // Keyboard shown - scrolled to bottom
    },
  });

  // Dynamic prompts hook for intelligent contextual options
  const {
    prompts: dynamicPrompts,
    isAnalyzing: isAnalyzingContext,
    executePrompt,
    refreshPrompts
  } = useDynamicPrompts({
    messages: messages.map(msg => ({
      id: msg.id,
      text: msg.message,
      sender: msg.sender === 'numina' ? 'ai' : msg.sender === 'system' ? 'ai' : msg.sender,
      timestamp: new Date(msg.timestamp).getTime()
    })),
    onPromptExecute: (promptText: string) => {
      // Execute the hidden prompt directly
      handleMessageSend(promptText);
      // Hide the modal after execution
      hideModalAnimation(modalAnimationRefs, () => setShowDynamicOptionsModal(false));
    },
    enabled: true,
    refreshInterval: 3
  });
  
  // UI State
  const [inputText, setInputText] = useState('');
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const [showTestTooltip, setShowTestTooltip] = useState(true);
  const [showDynamicOptionsModal, setShowDynamicOptionsModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  
  // Animation refs
  const tooltipOpacity = useRef(new Animated.Value(1)).current;
  const tooltipScale = useRef(new Animated.Value(1)).current;
  const modalAnimationRefs = useRef<ModalAnimationRefs>(createModalAnimationRefs()).current;
  const headerAnim = useRef(new Animated.Value(1)).current;

  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);
  
  // Conversation drawer state
  const [showConversationDrawer, setShowConversationDrawer] = useState(false);

  // Header menu hook
  const { showHeaderMenu, setShowHeaderMenu, handleMenuAction, toggleHeaderMenu } = useHeaderMenu({
    screenName: 'chat',
    onSettingsPress: () => setShowSettings(true),
    onSignOut: () => setShowSignOutModal(true)
  });

  // Smart suggestions based on context
  const [suggestions] = useState([
    "How are you feeling today?",
    "Help me understand my patterns",
    "What can you tell me about myself?",
    "Show me my behavioral insights",
    "Find me connections with similar interests",
  ]);



  // Handle sending message - simplified wrapper
  const handleSend = async () => {
    if ((!inputText.trim() && attachments.length === 0) || isLoading) return;
    
    await handleMessageSend(inputText, attachments);
    setInputText('');
    setAttachments([]);
    
    // Note: Scroll is now handled automatically by useNaturalScroll hook
    // No manual scroll triggers needed here
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


  // Enhanced message press handler with tooltip
  const handleMessagePressWithTooltip = async (message: any) => {
    await handleMessagePress(message);
    setShowCopyTooltip(true);
  };

  // Handle scroll to bottom button press
  const handleScrollToBottom = () => {
    scrollToBottom();
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

  // Handle input focus/blur for tooltip fade
  const handleInputFocus = () => {
    // Smooth fade out with gentle easing
    Animated.timing(tooltipOpacity, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    
    // Note: Scroll is now handled automatically by keyboard listeners in useNaturalScroll
    // No manual scroll trigger needed here
  };

  const handleInputBlur = () => {
    // Smooth fade in with delay and gentle easing
    setTimeout(() => {
      Animated.timing(tooltipOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 100);
  };

  // Handle dynamic options tooltip press
  const handleDynamicOptionsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createTooltipPressAnimation(tooltipScale);

    setTimeout(() => {
      setShowDynamicOptionsModal(true);
      showModalAnimation(modalAnimationRefs);
    }, 50);
  };

  // Modal hide handler
  const handleHideModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    hideModalAnimation(modalAnimationRefs, () => setShowDynamicOptionsModal(false));
  };

  // Render message item
  const renderMessage = ({ item, index }: { item: any; index: number }) => {
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
    
    return (
      <EnhancedBubble
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
                
                // Handle natural scroll behavior
                handleScroll(event);
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
        
        <View style={{ position: 'relative' }}>
          <Animated.View
            style={{
              position: 'absolute',
              top: -50, 
              left: 12,
              right: 12,
              zIndex: 1000,
              opacity: tooltipOpacity,
              transform: [{ scale: tooltipScale }],
            }}
          >
            <TouchableOpacity
              onPress={handleDynamicOptionsPress}
              activeOpacity={0.85}
              onPressIn={() => {
                // Subtle haptic feedback on press start
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Tooltip
                visible={showTestTooltip}
                leftText="Dynamic Options"
                rightText="• Swipe down to dismiss"
                theme={theme}
                onHide={() => setShowTestTooltip(false)}
                swipeToDismiss={true}
                style={{
                  position: 'relative',
                  top: 30,
                  width: '92%',
                }}
                tooltipStyle={{
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  width: '100%',
                }}
                textStyle={{
                  fontSize: 10,
                  lineHeight: 14,
                }}
                autoHideDuration={0}
              />
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.chatInputContainer}>
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
              voiceEnabled={false}
              enableFileUpload={true}
              maxAttachments={5}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              colorfulBubblesEnabled={settings.colorfulBubblesEnabled}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onSwipeUp={() => setShowTestTooltip(true)}
            />
          </View>
        </View>
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
      
      {/* Dynamic Options Modal */}
      {showDynamicOptionsModal && (
        <Animated.View 
          style={[
            styles.modalOverlay,
            {
              opacity: modalAnimationRefs.opacity,
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop}
            onPress={handleHideModal}
            activeOpacity={1}
          />
          <View style={styles.modalPositioner}>
            <Animated.View style={[
              styles.dynamicOptionsModal,
              getGlassmorphicStyle('card', theme),
              {
                backgroundColor: theme === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: colors.borders?.default || (theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                opacity: modalAnimationRefs.opacity,
                transform: [
                  { scale: modalAnimationRefs.scale },
                  { translateY: modalAnimationRefs.translateY }
                ],
              }
            ]}>
              <Text style={[
                styles.modalTitle,
                {
                  color: colors.text,
                }
              ]}>
                Explore Further
              </Text>
              
              {/* Dynamic contextual prompts */}
              <View style={styles.optionsContainer}>
                {isAnalyzingContext ? (
                  <View style={styles.loadingContainer}>
                    <Text style={[
                      styles.loadingText,
                      {
                        color: colors.textSecondary,
                      }
                    ]}>
                      Analyzing conversation...
                    </Text>
                  </View>
                ) : dynamicPrompts.length > 0 ? (
                  dynamicPrompts.map((prompt, index) => {
                    // Color coding: red, yellow, green for first 3 options
                    const dotColors = ['#FF4757', '#FFA502', '#2ED573'];
                    const dotColor = dotColors[index % 3];
                    
                    return (
                      <TouchableOpacity
                        key={prompt.id}
                        style={[
                          styles.promptOption,
                          {
                            backgroundColor: theme === 'dark' 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'rgba(0, 0, 0, 0.03)',
                            borderColor: theme === 'dark' 
                              ? 'rgba(255, 255, 255, 0.1)' 
                              : 'rgba(0, 0, 0, 0.08)',
                          }
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          executePrompt(prompt.id);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.promptHeader}>
                          <View style={[styles.colorDot, { backgroundColor: dotColor }]} />
                          <Text style={[
                            styles.promptText,
                            {
                              color: colors.text,
                            }
                          ]}>
                            {prompt.displayText}
                          </Text>
                        </View>
                        <Text style={[
                          styles.promptCategory,
                          {
                            color: colors.textMuted,
                          }
                        ]}>
                          {prompt.archetype}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={[
                    styles.placeholderText,
                    {
                      color: colors.textSecondary,
                    }
                  ]}>
                    Start a conversation to see contextual options
                  </Text>
                )}
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borders?.default || (theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                  }
                ]}
                onPress={handleHideModal}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.closeButtonText,
                  {
                    color: colors.text,
                  }
                ]}>
                  Close
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      )}
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


  // Messages
  messagesList: {
    flex: 1,
    paddingHorizontal: spacing[3],
    zIndex: 1, // Ensure messages appear above background but below header
  },
  messagesContent: {
    paddingTop: Platform.OS === 'ios' ? 140 : 120, // Extra clearance for header to prevent hiding
    paddingBottom: SCREEN_HEIGHT * 0.7, // Industry standard: Ample space for streaming content to flow into
    gap: spacing[3], // Increased spacing between messages for better readability
    minHeight: SCREEN_HEIGHT * 1.5, // Ensure enough space for natural scrolling behavior
  },

  // Dynamic Options Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalPositioner: {
    position: 'absolute',
    bottom: 110, 
    left: 12,
    right: 12,
  },
  dynamicOptionsModal: {
    width: '92%', 
    alignSelf: 'center', 
    borderRadius: 8, 
    borderWidth: 1,
    padding: spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  optionsContainer: {
    minHeight: 80,
    paddingVertical: spacing[1],
    gap: spacing[1],
  },
  loadingContainer: {
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  loadingText: {
    ...typography.textStyles.caption,
    fontStyle: 'italic',
  },
  promptOption: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing[2],
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[2],
  },
  promptText: {
    ...typography.textStyles.body,
    fontWeight: '600',
    flex: 1,
  },
  promptCategory: {
    ...typography.textStyles.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '500',
    opacity: 0.7,
  },
  placeholderText: {
    ...typography.textStyles.caption,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  closeButton: {
    marginTop: spacing[3],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  closeButtonText: {
    ...typography.textStyles.labelMedium,
    fontWeight: '500',
  },
  chatInputContainer: {
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    marginBottom: -spacing[4],
  },
});

export default ChatScreen;