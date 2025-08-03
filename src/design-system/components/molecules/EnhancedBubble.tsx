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
  Image,
  ScrollView,
} from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import LottieView from 'lottie-react-native';
import { designTokens, getThemeColors, getUserMessageColor, getStandardBorder, getCyclingPastelColor } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing, borderRadius } from '../../tokens/spacing';
import { getNeumorphicStyle } from '../../tokens/shadows';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import { ToolCall, Message, MessageAttachment } from '../../../types';
import BasicMarkdown from '../atoms/BasicMarkdown';
import { PhotoPreview } from './PhotoPreview';

const { width } = Dimensions.get('window');

interface ExtendedMessage extends Omit<Message, 'message'> {
  text?: string;
  message?: string;
  mood?: string;
  isSystem?: boolean;
  isStreaming?: boolean;
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

interface AnimatedMessageBubbleProps {
  message: ExtendedMessage;
  index: number;
  onSpeakMessage?: (text: string) => void;
  theme?: 'light' | 'dark';
  messageIndex?: number;
  onCopyMessage?: (text: string) => void;
  onReportMessage?: (message: Message) => void;
  onShareMessage?: (message: Message) => void;
}

// Streaming text with live markdown support
const StreamingText: React.FC<{
  text: string;
  theme: 'light' | 'dark';
  isStreaming?: boolean;
}> = memo(({ text, theme, isStreaming = false }) => {
  const baseTextStyle = {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.1,
    fontFamily: 'Nunito-Regular',
    fontWeight: '400' as '400',
    color: theme === 'dark' ? '#ffffff' : '#1a1a1a',
  };

  // Always apply markdown formatting, even during streaming
  // For streaming, we'll handle partial tokens gracefully
  if (text) {
    return (
      <View>
        <BasicMarkdown theme={theme} style={baseTextStyle}>
          {text}
        </BasicMarkdown>
        {/* Show cursor during streaming */}
        {isStreaming && (
          <Text style={[baseTextStyle, { position: 'absolute', right: -10, top: 0 }]}>
            |
          </Text>
        )}
      </View>
    );
  }

  // Fallback for empty text
  return (
    <View>
      <Text style={baseTextStyle}>
        {isStreaming ? '|' : ''}
      </Text>
    </View>
  );
});


// StreamContent - Simple streaming text with markdown support for non-streaming
const StreamContent: React.FC<{
  text: string | undefined;
  theme: 'light' | 'dark';
  messageId?: string;
  isStreaming?: boolean;
  metadata?: Message['metadata'];
}> = memo(({ text, theme, messageId, isStreaming, metadata }) => {
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
  
  // Use StreamingText for all bot messages (handles markdown when streaming completes)
  return (
    <View style={styles.botTextContainer}>
      <StreamingText 
        text={safeText}
        theme={theme}
        isStreaming={isStreaming}
      />
      {/* Show search results metadata for streaming search responses */}
      {metadata?.searchResults && metadata.sources && (
        <View style={styles.searchResultsContainer}>
          <Text style={[styles.searchResultsTitle, { color: theme === 'dark' ? '#a8d8ff' : '#8fc7ffff' }]}>
            🔍 Search Results for "{metadata.query}"
          </Text>
          {metadata.sources.map((source: any, index: number) => (
            <View key={index} style={styles.sourceCard}>
              <Text style={[styles.sourceTitle, { color: theme === 'dark' ? '#ffffff' : '#333333' }]}>
                {source.title}
              </Text>
              <Text style={[styles.sourceDomain, { color: theme === 'dark' ? '#cccccc' : '#666666' }]}>
                {source.domain}
              </Text>
            </View>
          ))}
        </View>
      )}
      {/* Show tool call results if available */}
      {metadata?.toolCalls && metadata.toolCalls.length > 0 && (
        <View style={styles.toolCallsContainer}>
          {metadata.toolCalls.map((toolCall: ToolCall, index: number) => (
            <View key={toolCall.id || index} style={styles.toolCallCard}>
              <Text style={[styles.toolCallName, { color: theme === 'dark' ? '#a8d8ff' : '#add6ffff' }]}>
                🔧 {toolCall.name.replace(/_/g, ' ')}
              </Text>
              {toolCall.status === 'completed' && toolCall.result && (
                <Text style={[styles.toolCallResult, { color: theme === 'dark' ? '#cccccc' : '#666666' }]}>
                  {typeof toolCall.result === 'string' ? toolCall.result : JSON.stringify(toolCall.result, null, 2)}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

const EnhancedBubble: React.FC<AnimatedMessageBubbleProps> = memo(({
  message,
  index,
  onSpeakMessage,
  theme = 'light',
  messageIndex = 0,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [isVisible, setIsVisible] = useState(false);
  
  const isUser = message.sender === 'user';
  const isSystem = message.isSystem || message.sender === 'system';
  const isStreaming = message.variant === 'streaming';

  // Action handlers
  const handleCopyMessage = useCallback(async () => {
    const textToCopy = message.text || message.message;
    if (textToCopy) {
      await Clipboard.setStringAsync(textToCopy);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [message.text, message.message]);

  const handleShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Render photo attachments using the working PhotoPreview component
  const renderPhotoAttachments = useCallback(() => {
    if (!message.attachments || message.attachments.length === 0) return null;

    const imageAttachments = message.attachments.filter(att => att.type === 'image');
    if (imageAttachments.length === 0) return null;

    const isUser = message.sender === 'user';

    return (
      <View style={isUser ? styles.photoAttachmentsContainer : styles.aiPhotoAttachmentsContainer}>
        {imageAttachments.map((attachment) => (
          <PhotoPreview
            key={attachment.id}
            attachment={attachment}
            isUser={isUser}
            onPress={() => handleImagePress(attachment)}
          />
        ))}
      </View>
    );
  }, [message.attachments, message.sender]);

  const handleReport = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleImagePress = useCallback((attachment: MessageAttachment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Image pressed:', attachment.uri);
    // TODO: Open full-screen image viewer
  }, []);

  // Format timestamp for display
  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }, []);

  // Show timestamp and actions for completed messages
  const showTimestampAndActions = !isStreaming && (message.text?.trim() || message.message?.trim() || (message.attachments && message.attachments.length > 0));

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
      <View>
        {isUser ? (
          // User messages
          <View style={styles.userMessageContainer}>
            {/* Render photo attachments first */}
            {renderPhotoAttachments()}
            {(message.text?.trim() || message.message?.trim()) && (
              <Animated.View style={[
                styles.userProfileBubble,
                getStandardBorder(theme as 'light' | 'dark'),
                {
                  backgroundColor: theme === 'light' ? '#FF0000' : '#202020',
                }
              ]}>
                <Text 
                  style={[
                    styles.messageText,
                    {
                      fontSize: 16,
                      lineHeight: 22,
                      letterSpacing: -0.1,
                      fontFamily: 'Nunito-Regular',
                      fontWeight: '400',
                      color: theme === 'dark' ? '#ffffff' : '#1a1a1a',
                      textAlign: 'left',
                    }
                  ]}
                  numberOfLines={0}
                  ellipsizeMode="tail"
                >
                  {message.text || message.message}
                </Text>
              </Animated.View>
            )}
          </View>
        ) : (
          // Bot messages - no bubble, just animated text
          <View style={styles.botTextWrapper}>
            <StreamContent 
              text={message.text || message.message}
              theme={theme}
              messageId={message.id}
              isStreaming={isStreaming}
              metadata={message.metadata}
            />
            {showTimestampAndActions && (
              <View style={styles.botMessageFooter}>
                <TouchableOpacity 
                  onPress={handleCopyMessage}
                  style={styles.actionButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons 
                    name="copy-outline" 
                    size={14} 
                    color={theme === 'dark' ? '#888888' : '#666666'} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleReport}
                  style={styles.actionButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons 
                    name="ellipsis-horizontal" 
                    size={14} 
                    color={theme === 'dark' ? '#888888' : '#666666'} 
                  />
                </TouchableOpacity>
                <Text style={[styles.timestamp, { color: theme === 'dark' ? '#888888' : '#666666' }]}>
                  {formatTimestamp(message.timestamp)}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: 0,
    width: '100%',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    width: '100%',
  },
  userProfileBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: width * 0.8,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  botTextWrapper: {
    maxWidth: width * 0.95,
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
  searchResultsContainer: {
    marginTop: spacing[2],
    padding: spacing[2],
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.1)',
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
    marginBottom: spacing[2],
  },
  sourceCard: {
    marginBottom: spacing[1],
    paddingVertical: spacing[1],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 102, 204, 0.1)',
  },
  sourceTitle: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Nunito-Medium',
    marginBottom: 2,
  },
  sourceDomain: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    opacity: 0.7,
  },
  toolCallsContainer: {
    marginTop: spacing[2],
    gap: spacing[1],
  },
  toolCallCard: {
    padding: spacing[2],
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.1)',
  },
  toolCallName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
    marginBottom: spacing[1],
    textTransform: 'capitalize',
  },
  toolCallResult: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    lineHeight: 18,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
    paddingHorizontal: spacing[2],
    width: '100%',
  },
  botMessageFooter: {
    justifyContent: 'flex-start',
    paddingHorizontal: spacing[1],
    marginTop: 0,
    marginBottom: 0,
  },
  timestamp: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
    opacity: 0.7,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingLeft: spacing[2],
  },
  actionButton: {
    padding: spacing[1] / 2,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  // Photo attachment containers
  photoAttachmentsContainer: {
    gap: 6,
    alignItems: 'flex-end',
  },
  aiPhotoAttachmentsContainer: {
    gap: 6,
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },
});

export default EnhancedBubble;