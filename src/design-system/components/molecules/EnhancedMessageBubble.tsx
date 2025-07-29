/**
 * Numina Design System - Enhanced Message Bubble Component
 * Sophisticated message bubbles with advanced features from numina-mobile
 */

import React, { useRef, useEffect, useState } from 'react';
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
import { designTokens, getThemeColors, getUserMessageColor, getStandardBorder } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing, borderRadius } from '../../tokens/spacing';
import { getNeumorphicStyle } from '../../tokens/shadows';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import MarkdownText from '../atoms/MarkdownText';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'numina' | 'system';
  timestamp: string;
  mood?: string;
  isStreaming?: boolean;
  attachments?: MessageAttachment[];
  isSystem?: boolean;
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

interface EnhancedMessageBubbleProps {
  message: Message;
  index: number;
  onLongPress?: (message: Message) => void;
  onSpeakMessage?: (text: string) => void;
  theme?: 'light' | 'dark';
  messageIndex?: number;
  colorfulBubblesEnabled?: boolean;
}

// Component for rendering formatted bot messages
const BotMessageContent: React.FC<{
  text: string | undefined;
  isStreaming?: boolean;
  theme: 'light' | 'dark';
  messageId?: string;
}> = ({ text, isStreaming, theme, messageId }) => {
  const safeText = text || '';
  const themeColors = getThemeColors(theme as 'light' | 'dark');
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  // Animate cursor blinking when streaming
  useEffect(() => {
    if (isStreaming && safeText.trim()) {
      const blinkAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorOpacity, {
            toValue: 0,
            duration: 300, // Faster blinking
            useNativeDriver: true,
          }),
          Animated.timing(cursorOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
      blinkAnimation.start();
      return () => blinkAnimation.stop();
    } else {
      cursorOpacity.setValue(1);
    }
  }, [isStreaming, safeText]);
  
  // Show Lottie animation when streaming and no text yet, or for typing indicator
  const isTypingMessage = messageId === 'typing';
  if ((isStreaming && !safeText.trim()) || isTypingMessage) {
    return (
      <View style={styles.botTextContainer}>
        <LottieView
          source={require('../../../../assets/BotMessageLottie.json')}
          autoPlay
          loop
          style={styles.lottieAnimation}
        />
      </View>
    );
  }
  
  return (
    <View style={styles.botTextContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <MarkdownText style={{ ...typography.textStyles.bodyMedium, color: themeColors.text }}>
{safeText}
        </MarkdownText>
        {isStreaming && (
          <Animated.Text style={[
            styles.streamingCursor,
            {
              color: themeColors.text,
              opacity: cursorOpacity,
            }
          ]}>|</Animated.Text>
        )}
      </View>
    </View>
  );
};

export const EnhancedMessageBubble: React.FC<EnhancedMessageBubbleProps> = ({
  message,
  index,
  onLongPress,
  onSpeakMessage,
  theme = 'light',
  messageIndex = 0,
  colorfulBubblesEnabled = false,
}) => {
  const themeColors = getThemeColors(theme as 'light' | 'dark');
  const [isPressed, setIsPressed] = useState(false);
  const [hasStartedStreaming, setHasStartedStreaming] = useState(false);
  
  const isUser = message?.sender === 'user';
  const isAI = message?.sender === 'numina';
  const isSystem = message?.sender === 'system';
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isUser ? 100 : 80)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const timestampOpacity = useRef(new Animated.Value(0)).current;
  const personalityHeaderOpacity = useRef(new Animated.Value(0)).current;
  const personalityHeaderSlide = useRef(new Animated.Value(20)).current;

  // Entry animation with stagger (faster for real-time feel)
  useEffect(() => {
    const delay = index * 8; // Reduced from 15 to 8
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: isUser ? 40 : 70, // Reduced by ~50%
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        delay,
        duration: isUser ? 90 : 110, // Reduced by ~50%
        useNativeDriver: true,
        easing: isUser ? 
          Easing.out(Easing.cubic) : 
          Easing.out(Easing.quad),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: isUser ? 50 : 70, // Reduced by ~50%
        delay,
        useNativeDriver: true,
        easing: isUser ? Easing.out(Easing.ease) : Easing.out(Easing.quad),
      }),
    ]).start();
    
    if (isUser) {
      timestampOpacity.setValue(1);
    }
    
    if (isAI && message.personalityContext) {
      const personalityDelay = delay + 50; // Reduced from 100
      Animated.parallel([
        Animated.spring(personalityHeaderOpacity, {
          toValue: 1,
          delay: personalityDelay,
          useNativeDriver: true,
          speed: 30, // Increased from 20
          bounciness: 4, // Reduced from 6
        }),
        Animated.spring(personalityHeaderSlide, {
          toValue: 0,
          delay: personalityDelay,
          useNativeDriver: true,
          speed: 30, // Increased from 20
          bounciness: 4, // Reduced from 6
        }),
      ]).start();
    }
  }, [index, isUser, isAI, message.personalityContext?.communicationStyle]);

  // Simple haptic feedback for streaming start/end
  useEffect(() => {
    if (message?.isStreaming && !hasStartedStreaming && isAI) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setHasStartedStreaming(true);
      timestampOpacity.setValue(0);
    } else if (!message?.isStreaming && hasStartedStreaming && isAI) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setHasStartedStreaming(false);
      setTimeout(() => {
        Animated.timing(timestampOpacity, {
          toValue: 1,
          duration: 70, // Reduced from 140
          useNativeDriver: true,
        }).start();
      }, 140);
    }
  }, [message?.isStreaming, hasStartedStreaming, isAI]);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.timing(pressAnim, {
      toValue: 0.98,
      duration: 25,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: 25,
      useNativeDriver: true,
    }).start();
  };

  const handleLongPress = () => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate([10]);
    } else {
      Vibration.vibrate(50);
    }
    onLongPress?.(message);
  };

  const handleSpeakPress = () => {
    onSpeakMessage?.(message.text);
  };

  const getMoodColor = (mood?: string) => {
    switch (mood?.toLowerCase()) {
      case 'happy': return '#10b981';
      case 'sad': return '#3b82f6';
      case 'angry': return '#ef4444';
      case 'anxious': return '#f59e0b';
      case 'excited': return '#8b5cf6';
      case 'calm': return '#06b6d4';
      default: return designTokens.brand.primary;
    }
  };

  const formatTime = (timestamp: string) => {
    // Handle both ISO timestamp strings and already formatted time strings
    const date = new Date(timestamp);
    
    // Check if it's a valid date
    if (isNaN(date.getTime())) {
      // If it's already a formatted time string, return as is
      return timestamp;
    }
    
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPersonalityColor = (style: string) => {
    switch (style) {
      case 'supportive': return '#87c3eb';
      case 'direct': return '#f2ff79';
      case 'collaborative': return '#6BCF7F';
      case 'encouraging': return '#a179ff';
      default: return '#9ac9c6b0';
    }
  };

  const getPersonalityIcon = (style: string) => {
    switch (style) {
      case 'supportive': return 'heart';
      case 'direct': return 'bullseye';
      case 'collaborative': return 'users';
      case 'encouraging': return 'star';
      default: return 'comment';
    }
  };

  const getPersonalityLabel = (style: string) => {
    switch (style) {
      case 'supportive': return 'Supportive Mode';
      case 'direct': return 'Direct Mode';
      case 'collaborative': return 'Collaborative Mode';
      case 'encouraging': return 'Encouraging Mode';
      default: return 'Standard Mode';
    }
  };

  const getBubbleStyles = () => {
    if (isSystem) {
      return [
        getGlassmorphicStyle('card', theme as 'light' | 'dark'),
        getStandardBorder(theme),
        styles.systemBubble,
        {
          backgroundColor: designTokens.pastels.cyan + '40',
        }
      ];
    }

    if (isUser) {
      return [
        getNeumorphicStyle('elevated', theme as 'light' | 'dark'),
        getStandardBorder(theme),
        styles.userBubble,
        {
          backgroundColor: getUserMessageColor(messageIndex, theme, colorfulBubblesEnabled),
          alignSelf: 'flex-end',
          marginLeft: spacing[6],
        }
      ];
    }

    // AI bubble - include typing state
    const isTypingMessage = message.id === 'typing';
    const isActiveStreaming = message.isStreaming || isTypingMessage;
    const standardBorder = getStandardBorder(theme as 'light' | 'dark');
    
    return [
      getNeumorphicStyle(isActiveStreaming ? 'floating' : 'elevated', theme as 'light' | 'dark'),
      standardBorder,
      styles.aiBubble,
      {
        backgroundColor: themeColors.surface,
        alignSelf: 'flex-start',
        marginRight: spacing[6],
        // Override border for streaming/typing with special color, otherwise use standard border
        borderColor: isActiveStreaming ? getUserMessageColor(messageIndex, theme, colorfulBubblesEnabled) + '60' : standardBorder.borderColor,
        shadowColor: isActiveStreaming ? getUserMessageColor(messageIndex, theme, colorfulBubblesEnabled) : undefined,
        shadowOpacity: isActiveStreaming ? 0.4 : undefined,
        shadowRadius: isActiveStreaming ? 6 : undefined,
      }
    ];
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: isUser ? slideAnim : 0 },
            { translateY: isUser ? 0 : slideAnim },
            { scale: scaleAnim },
          ],
        },
        isUser ? styles.userContainer : styles.aiContainer,
      ]}
    >
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        activeOpacity={0.95}
        style={isUser ? styles.userMessageWrapper : styles.messageWrapper}
      >
        {isUser ? (
          /* User Message */
          <View style={styles.userMessageContainer}>
            {/* Attachments would go here */}
            
            {/* Text Message Bubble */}
            {message.text?.trim() && (
              <Animated.View style={[
                getBubbleStyles() as any,
                {
                  transform: [{ scale: pressAnim }],
                }
              ].flat()}>
                <View style={styles.textContainer}>
                  <Text style={[
                    styles.messageText,
                    typography.textStyles.bodyMedium,
                    {
                      color: '#ffffff',
                      letterSpacing: -0.3,
                      lineHeight: 20,
                    }
                  ]}>
                    {message.text}
                  </Text>
                </View>
              </Animated.View>
            )}
          </View>
        ) : (
          /* AI/System Message */
          <View style={styles.botMessageContainer}>
            {/* Personality Context Header */}
            {message.personalityContext && !isSystem && (
              <Animated.View style={[
                styles.personalityHeader,
                {
                  backgroundColor: getPersonalityColor(message.personalityContext.communicationStyle) + '15',
                  borderColor: getPersonalityColor(message.personalityContext.communicationStyle) + '30',
                  opacity: personalityHeaderOpacity,
                  transform: [{ translateY: personalityHeaderSlide }],
                }
              ]}>
                <FontAwesome5
                  name={getPersonalityIcon(message.personalityContext.communicationStyle) as any}
                  size={12}
                  color={getPersonalityColor(message.personalityContext.communicationStyle)}
                />
                <Text style={[
                  styles.personalityText,
                  typography.textStyles.caption,
                  { color: getPersonalityColor(message.personalityContext.communicationStyle) }
                ]}>
                  {getPersonalityLabel(message.personalityContext.communicationStyle)}
                  {message.personalityContext.adaptedResponse ? ' • Adapted for you' : ''}
                </Text>
                {message.personalityContext.userMoodDetected && (
                  <View style={[
                    styles.moodDetectedIndicator,
                    { backgroundColor: getMoodColor(message.personalityContext.userMoodDetected) }
                  ]}>
                    <Text style={styles.moodDetectedText}>
                      {message.personalityContext.userMoodDetected}
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}
            
            {/* Main Message Content */}
            {isSystem ? (
              <Animated.View style={[
                getBubbleStyles() as any,
                {
                  transform: [{ scale: pressAnim }],
                }
              ].flat()}>
                <Text style={[
                  styles.systemMessageText,
                  typography.textStyles.bodyMedium,
                  { color: designTokens.brand.primary }
                ]}>
                  {message.text}
                </Text>
              </Animated.View>
            ) : (
              <Animated.View style={[
                getBubbleStyles() as any,
                {
                  transform: [{ scale: pressAnim }],
                }
              ].flat()}>
                <BotMessageContent 
                  text={message.text}
                  isStreaming={message.isStreaming}
                  theme={theme}
                  messageId={message.id}
                />
              </Animated.View>
            )}
            
            {/* AI Insight Section */}
            {message.aiInsight && !isSystem && (
              <View style={[
                styles.aiInsightContainer,
                getGlassmorphicStyle('card', theme as 'light' | 'dark'),
                {
                  backgroundColor: theme === 'dark' ? '#1a1a2e' : '#f8f9ff',
                  borderColor: theme === 'dark' ? '#4a4a6a' : '#e0e7ff',
                }
              ]}>
                <View style={styles.insightHeader}>
                  <FontAwesome5
                    name="lightbulb"
                    size={12}
                    color="#FFD93D"
                  />
                  <Text style={[
                    styles.insightTitle,
                    typography.textStyles.caption,
                    { color: theme === 'dark' ? '#ffd93d' : '#8b5a00' }
                  ]}>
                    Pattern Insight ({Math.round(message.aiInsight.confidence * 100)}%)
                  </Text>
                </View>
                <Text style={[
                  styles.insightPattern,
                  typography.textStyles.bodySmall,
                  { color: themeColors.textSecondary }
                ]}>
                  {message.aiInsight.pattern}
                </Text>
                <Text style={[
                  styles.insightSuggestion,
                  typography.textStyles.bodySmall,
                  { color: theme === 'dark' ? '#a7f3d0' : '#065f46' }
                ]}>
                  💡 {message.aiInsight.suggestion}
                </Text>
              </View>
            )}
            
            {/* Timestamp */}
            <Animated.Text style={[
              styles.aiMessageTimestamp,
              typography.textStyles.timestamp,
              {
                color: themeColors.textMuted,
                opacity: timestampOpacity,
              }
            ]}>
              {formatTime(message.timestamp)}
            </Animated.Text>
          </View>
        )}

        {/* User Timestamp */}
        {isUser && (
          <Text style={[
            styles.userTimestamp,
            typography.textStyles.timestamp,
            {
              color: themeColors.textMuted,
            }
          ]}>
            {formatTime(message.timestamp)}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[1],
    marginHorizontal: spacing[1] / 2,
  },
  userContainer: {
    alignItems: 'flex-end',
    paddingRight: spacing[2],
  },
  aiContainer: {
    alignItems: 'flex-start',
    paddingLeft: spacing[2], 
  },
  messageWrapper: {
    maxWidth: width * 0.95,
  },
  userMessageWrapper: {
    maxWidth: width * 0.92,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    gap: spacing[1],
    marginRight: spacing[1],
  },
  botMessageContainer: {
    width: '100%',
    paddingHorizontal: spacing[1] / 2,
    paddingVertical: spacing[1],
    position: 'relative',
  },
  botTextContainer: {
    width: '100%',
    position: 'relative',
    paddingVertical: spacing[1] / 2,
  },
  lottieAnimation: {
    width: 60,
    height: 40,
    alignSelf: 'center',
  },
  userBubble: {
    borderRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.sm,
    paddingHorizontal: spacing[4] * 0.7,
    paddingVertical: spacing[3] * 0.7,
    marginVertical: spacing[1] / 2,
    maxWidth: '92%',
    minWidth: 60,
  },
  aiBubble: {
    borderRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.sm,
    paddingHorizontal: spacing[4] * 0.7,
    paddingVertical: spacing[3] * 0.7,
    marginVertical: spacing[1] / 2,
    maxWidth: '92%',
    minWidth: 60,
  },
  systemBubble: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[4] * 0.7,
    paddingVertical: spacing[3] * 0.7,
    marginVertical: spacing[1] / 2,
    marginHorizontal: spacing[8],
    alignSelf: 'center',
  },
  textContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  messageText: {
    fontWeight: '400',
  },
  systemMessageText: {
    textAlign: 'center',
  },
  streamingCursor: {
    opacity: 0.7,
    fontWeight: 'bold',
  },
  userTimestamp: {
    textAlign: 'right',
    marginTop: spacing[1] / 2,
  },
  aiMessageTimestamp: {
    alignSelf: 'flex-start',
    marginTop: spacing[2],
    marginLeft: spacing[1] / 2,
    opacity: 0.6,
  },

  // AI Personality Styles
  personalityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] / 2,
    marginBottom: spacing[2],
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing[2],
    maxWidth: '90%',
  },
  personalityText: {
    fontWeight: '600',
    flex: 1,
  },
  moodDetectedIndicator: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] / 2,
    borderRadius: 8,
  },
  moodDetectedText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
  },
  aiInsightContainer: {
    marginTop: spacing[3],
    padding: spacing[2],
    borderRadius: 12,
    borderWidth: 1,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  insightTitle: {
    fontWeight: '600',
  },
  insightPattern: {
    marginBottom: spacing[1],
    fontStyle: 'italic',
  },
  insightSuggestion: {
    fontWeight: '500',
  },
});

export default EnhancedMessageBubble;