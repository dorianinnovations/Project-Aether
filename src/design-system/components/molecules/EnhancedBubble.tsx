/**
 * EnhancedBubble - Proprietary Message Component
 * Features intelligent word-by-word streaming with fade animations
 * The KING of message bubbles
 */

import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
  Vibration,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { designTokens, getThemeColors, getUserMessageColor, getStandardBorder, getCyclingPastelColor } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing, borderRadius } from '../../tokens/spacing';
import { getNeumorphicStyle } from '../../tokens/shadows';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import { ToolCall } from '../../../types';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'numina' | 'system';
  timestamp: string;
  variant?: 'default' | 'streaming' | 'error' | 'tool';
  mood?: string;
  attachments?: MessageAttachment[];
  isSystem?: boolean;
  metadata?: {
    toolUsed?: string;
    toolCalls?: ToolCall[];
    confidence?: number;
    processingTime?: number;
    searchResults?: boolean;
    query?: string;
    sources?: Array<{
      title: string;
      url: string;
      domain: string;
    }>;
  };
  personalityContext?: {
    communicationStyle: 'supportive' | 'direct' | 'collaborative' | 'encouraging';
    emotionalTone: 'supportive' | 'celebratory' | 'analytical' | 'calming';
    adaptedResponse: boolean;
    userMoodDetected?: string;
    responsePersonalization?: string;
  };
  aiInsight?: {
    pattern: string;
    suggestion: string;
    confidence: number;
  };
}

interface MessageAttachment {
  id: string;
  type: 'image' | 'document';
  name: string;
  uri: string;
  size: number;
  uploadStatus: 'pending' | 'uploaded' | 'error';
  mimeType?: string;
}

interface AnimatedMessageBubbleProps {
  message: Message;
  index: number;
  onLongPress?: (message: Message) => void;
  onSpeakMessage?: (text: string) => void;
  theme?: 'light' | 'dark';
  messageIndex?: number;
  colorfulBubblesEnabled?: boolean;
}

// Simple streaming text - no markdown processing to avoid word concatenation
const StreamingText: React.FC<{
  text: string;
  theme: 'light' | 'dark';
  isStreaming?: boolean;
}> = memo(({ text, theme, isStreaming = false }) => {
  const baseTextStyle = {
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: -0.2,
    fontFamily: 'Nunito-Regular',
    fontWeight: '400' as '400',
    color: theme === 'dark' ? '#ffffff' : '#1a1a1a',
  };

  return (
    <View>
      <Text style={baseTextStyle}>
        {`${text}${isStreaming ? '|' : ''}`}
      </Text>
    </View>
  );
});


// StreamContent - Simple streaming text
const StreamContent: React.FC<{
  text: string | undefined;
  theme: 'light' | 'dark';
  messageId?: string;
  isStreaming?: boolean;
}> = memo(({ text, theme, messageId, isStreaming }) => {
  const safeText = text || '';
  
  // Show Lottie animation for typing indicator or empty streaming message
  const isTypingMessage = messageId === 'typing';
  if (isTypingMessage || (isStreaming && !safeText.trim())) {
    return (
      <LottieView
        source={require('../../../../assets/NuminaCloudBubble.json')}
        autoPlay
        loop
        style={styles.lottieAnimation}
      />
    );
  }
  
  return (
    <View style={styles.botTextContainer}>
      <StreamingText 
        text={safeText}
        theme={theme}
        isStreaming={isStreaming}
      />
    </View>
  );
});

const EnhancedBubble: React.FC<AnimatedMessageBubbleProps> = memo(({
  message,
  index,
  onLongPress,
  onSpeakMessage,
  theme = 'light',
  messageIndex = 0,
  colorfulBubblesEnabled = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [isVisible, setIsVisible] = useState(false);
  
  const isUser = message.sender === 'user';
  const isSystem = message.isSystem || message.sender === 'system';
  const isStreaming = message.variant === 'streaming';

  // Memoized long press handler
  const handleLongPress = useCallback(() => {
    onLongPress?.(message);
  }, [onLongPress, message]);

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const themeColors = getThemeColors(theme as 'light' | 'dark');

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          alignSelf: isUser ? 'flex-end' : 'flex-start',
        },
      ]}
    >
      <TouchableOpacity
        onLongPress={handleLongPress}
        activeOpacity={0.7}
        disabled={isSystem}
      >
        {isUser ? (
          // User messages
          <View style={styles.userMessageContainer}>
            {message.text?.trim() && (
              <Animated.View style={[
                styles.userProfileBubble,
                getStandardBorder(theme as 'light' | 'dark'),
                {
                  backgroundColor: getUserMessageColor(messageIndex, theme, colorfulBubblesEnabled),
                }
              ]}>
                <Text 
                  style={[
                    styles.messageText,
                    {
                      fontSize: 17,
                      lineHeight: 24,
                      letterSpacing: -0.2,
                      fontFamily: 'Nunito-Regular',
                      fontWeight: '400',
                      color: theme === 'dark' ? '#ffffff' : '#1a1a1a',
                      textAlign: 'left', // Left align instead of center
                      // Remove width constraint that was causing overflow
                    }
                  ]}
                  numberOfLines={0}
                  ellipsizeMode="tail"
                >
                  {message.text}
                </Text>
              </Animated.View>
            )}
          </View>
        ) : (
          // Bot messages - no bubble, just animated text
          <View style={styles.botTextWrapper}>
            <StreamContent 
              text={message.text}
              theme={theme}
              messageId={message.id}
              isStreaming={isStreaming}
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: spacing[1],
    width: '100%', // Full width instead of maxWidth constraint
    flexShrink: 0, // Prevent shrinking
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    gap: spacing[1] / 4,
    width: '100%',
    overflow: 'visible',
    flexShrink: 0, // Prevent container shrinking
  },
  userProfileBubble: {
    borderRadius: 12,
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: spacing[1] + 2,
    marginVertical: spacing[1] / 2,
    maxWidth: width * 0.75, // Slightly smaller to ensure proper wrapping
    minWidth: 50,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexShrink: 1, // Allow shrinking to fit content properly
    overflow: 'hidden', // Prevent text overflow
  },
  userMessageText: {
    ...typography.textStyles.body,
  },
  botTextWrapper: {
    marginVertical: spacing[1] / 2,
    paddingHorizontal: spacing[1] / 2,
    maxWidth: width * 0.95, // Stretch much further right
    alignSelf: 'flex-start',
  },
  botTextContainer: {
    flexDirection: 'column',
  },
  messageText: {
    ...typography.textStyles.body,
  },
  lottieAnimation: {
    width: 76.5, // Reduced by 15% from 90
    height: 46.75, // Reduced by 15% from 55
    alignSelf: 'flex-start',
  },
});

export default EnhancedBubble;