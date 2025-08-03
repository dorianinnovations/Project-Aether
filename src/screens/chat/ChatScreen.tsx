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
import LottieView from 'lottie-react-native';

// Enhanced Components
import { EnhancedChatInput, ChatHeader } from '../../design-system/components/molecules';
import EnhancedBubble from '../../design-system/components/molecules/EnhancedBubble';
import BasicMarkdown from '../../design-system/components/atoms/BasicMarkdown';
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
import { useSimpleScroll } from '../../hooks/useSimpleScroll';

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
    setMessages,
    flatListRef: messagesRef,
  } = useMessages(() => setShowGreeting(false));

  // Simple scroll hook
  const { 
    flatListRef, 
    scrollToBottom, 
    gentleScrollDown, 
    handleScrollBegin, 
    handleScrollEnd,
    showScrollButton
  } = useSimpleScroll();

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
    
    // Auto-scroll will be handled by the FlatList onContentSizeChange
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
    if (!inputText.trim() && (!attachments || attachments.length === 0)) return;
    
    if (attachments && attachments.length > 0) {
      // Handle attachments
      console.log('Sending with attachments:', attachments);
    }
    
    // Send the message with the current input text
    handleMessageSend(inputText);
    
    // Clear the input text after sending
    setInputText('');
    
    // Clear attachments after sending
    setAttachments([]);
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
    
    // Smooth scroll to bottom when input is focused
    scrollToBottom();
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
    const isUser = item.sender === 'user';
    const themeColors = getThemeColors(theme);
    
    return (
      <View style={styles.messageItem}>
        {isUser ? (
          <View style={styles.userContainer}>
            <View style={[
              styles.userBubble,
              {
                backgroundColor: theme === 'dark' ? '#2A2A2A' : '#F0F0F0',
                borderTopWidth: 1,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderBottomWidth: 1,
                borderTopColor: theme === 'dark' ? '#454545' : '#FFFFFF',
                borderLeftColor: theme === 'dark' ? '#454545' : '#FFFFFF',
                borderRightColor: theme === 'dark' ? '#151515' : '#C8C8C8',
                borderBottomColor: theme === 'dark' ? '#151515' : '#C8C8C8',
                shadowColor: theme === 'dark' ? '#000000' : '#000000',
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: theme === 'dark' ? 0.4 : 0.15,
                shadowRadius: 4,
                elevation: 3,
              }
            ]}>
              <Text style={[
                styles.userText,
                { color: theme === 'dark' ? '#ffffff' : '#1a1a1a' }
              ]}>
                {item.message}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.botContainer}>
            {item.variant === 'streaming' && !item.message?.trim() ? (
              <LottieView
                source={require('../../../assets/NuminaCloudBubble.json')}
                autoPlay
                loop
                style={styles.lottieAnimation}
              />
            ) : (
              <BasicMarkdown theme={theme} style={[
                styles.botText,
                { color: theme === 'dark' ? '#ffffff' : '#1a1a1a' }
              ]}>
                {item.message}
              </BasicMarkdown>
            )}
          </View>
        )}
      </View>
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
      
      <View style={styles.chatArea}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: headerAnim } } }],
            { 
              useNativeDriver: false,
              listener: (event: any) => {
                const offsetY = event.nativeEvent.contentOffset.y;
                headerAnim.setValue(offsetY > 50 ? 0.8 : 1);
              }
            }
          )}
          onScrollBeginDrag={handleScrollBegin}
          onScrollEndDrag={handleScrollEnd}
          onContentSizeChange={gentleScrollDown}
        />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        {showScrollButton && (
          <TouchableOpacity 
            onPress={scrollToBottom}
            style={styles.scrollToBottomButton}
            activeOpacity={0.7}
          >
            <View style={[
              styles.scrollButtonCircle,
              { backgroundColor: theme === 'dark' ? '#2A2A2A' : '#ffffff' }
            ]}>
              <Text style={[
                styles.scrollButtonArrow,
                { color: theme === 'dark' ? '#ffffff' : '#444444' }
              ]}>
                ↓
              </Text>
            </View>
          </TouchableOpacity>
        )}
        
        <View style={styles.chatInputWrapper}>
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
        onStartNewChat={() => {
          setMessages([]);
          setShowConversationDrawer(false);
        }}
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
  
  // Chat Layout
  chatArea: {
    flex: 1,
  },
  
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  messagesContainer: {
    paddingTop: Platform.OS === 'ios' ? 90 : 70,
    paddingBottom: 16,
    gap: 0,
  },
  
  inputContainer: {
    backgroundColor: 'transparent',
  },
  
  chatInputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  // Message Styles
  messageItem: {
    marginVertical: 8,
    width: '100%',
  },
  
  userContainer: {
    alignItems: 'flex-end',
    width: '100%',
  },
  
  userBubble: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  userText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Nunito-Regular',
    fontWeight: '400',
  },
  
  botContainer: {
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 4,
  },
  
  botText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Nunito-Regular',
    fontWeight: '400',
    maxWidth: '95%',
  },

  lottieAnimation: {
    width: 76,
    height: 46,
    alignSelf: 'flex-start',
  },

  // Scroll to Bottom Button
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    zIndex: 1000,
  },
  
  scrollButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  
  scrollButtonArrow: {
    fontSize: 18,
    fontWeight: 'bold',
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
    transform: [{ translateY: -12 }],
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    letterSpacing: -0.3,
    textAlign: 'center',
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
});

export default ChatScreen;