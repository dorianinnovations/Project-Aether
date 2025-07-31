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
import { ToolCall } from '../../../types';
// SearchResultsModal removed - sources shown inline

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
  theme: 'light' | 'dark';
  messageId?: string;
  isStreaming?: boolean;
}> = ({ text, theme, messageId, isStreaming }) => {
  const safeText = text || '';
  const themeColors = getThemeColors(theme as 'light' | 'dark');
  
  // Show Lottie animation for typing indicator or empty streaming message
  const isTypingMessage = messageId === 'typing';
  if (isTypingMessage || (isStreaming && !safeText.trim())) {
    return (
      <LottieView
        source={require('../../../../assets/CPUProcessorLottie.json')}
        autoPlay
        loop
        style={styles.lottieAnimation}
      />
    );
  }
  
  return (
    <View style={styles.botTextContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <MarkdownText 
          theme={theme}
          style={{ 
            fontSize: 17,
            lineHeight: 26,
            letterSpacing: -0.2,
            fontFamily: 'Nunito-Regular',
            fontWeight: '400',
            color: theme === 'dark' ? '#ffffff' : '#1a1a1a',
            flexShrink: 1,
          }}
        >
{safeText}
        </MarkdownText>
      </View>
    </View>
  );
};

// Component for rendering tool calls
const ToolCallDisplay: React.FC<{
  toolCalls: ToolCall[];
  theme: 'light' | 'dark';
}> = ({ toolCalls, theme }) => {
  const themeColors = getThemeColors(theme);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState<{
    query: string;
    results: any[];
  } | null>(null);

  // Helper function to extract domain from URL
  const extractDomain = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };
  
  const getToolIcon = (toolName: string) => {
    switch (toolName.toLowerCase()) {
      case 'web_search':
      case 'websearch':
        return 'search';
      case 'image_search':
        return 'images';
      case 'calculator':
        return 'calculator';
      case 'weather':
        return 'cloud-sun';
      case 'translation':
        return 'language';
      default:
        return 'tools';
    }
  };

  const getToolLabel = (toolName: string) => {
    switch (toolName.toLowerCase()) {
      case 'web_search':
      case 'websearch':
        return 'Web Search';
      case 'image_search':
        return 'Image Search';
      case 'calculator':
        return 'Calculator';
      case 'weather':
        return 'Weather';
      case 'translation':
        return 'Translation';
      default:
        return toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'running':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'running':
        return 'clock';
      case 'failed':
        return 'exclamation-circle';
      default:
        return 'clock';
    }
  };

  // Function to parse search results from tool call result
  const parseSearchResults = (result: any): any[] => {
    if (!result) return [];
    
    // Handle array of results directly
    if (Array.isArray(result)) {
      return result.map(normalizeResult).filter(Boolean);
    }
    
    // Handle object with results property
    if (result.results && Array.isArray(result.results)) {
      return result.results.map(normalizeResult).filter(Boolean);
    }
    
    // Handle object with links property
    if (result.links && Array.isArray(result.links)) {
      return result.links.map(normalizeResult).filter(Boolean);
    }
    
    // Try to parse JSON string
    if (typeof result === 'string') {
      try {
        const parsed = JSON.parse(result);
        
        if (Array.isArray(parsed)) {
          return parsed.map(normalizeResult).filter(Boolean);
        }
        if (parsed.results && Array.isArray(parsed.results)) {
          return parsed.results.map(normalizeResult).filter(Boolean);
        }
        if (parsed.links && Array.isArray(parsed.links)) {
          return parsed.links.map(normalizeResult).filter(Boolean);
        }
        
        // If it's a single object, wrap it in an array
        if (typeof parsed === 'object' && parsed !== null) {
          const normalized = normalizeResult(parsed);
          return normalized ? [normalized] : [];
        }
      } catch (e) {
        // If it's not JSON, extract URLs from the text if possible
        const urlRegex = /https?:\/\/[^\s]+/g;
        const urls = result.match(urlRegex) || [];
        
        if (urls.length > 0) {
          return urls.slice(0, 5).map((url: string, index: number) => ({
            title: `Search Result ${index + 1}`,
            url: url.replace(/[)\]}.,;]*$/, ''), // Clean trailing punctuation
            snippet: "Link found in search results",
            domain: extractDomain(url)
          }));
        }
        
        // Fallback: Don't show raw text, show a clean placeholder
        return [{
          title: "Search completed",
          url: "https://google.com/search?q=" + encodeURIComponent("search results"),
          snippet: "Search operation completed successfully",
          domain: "google.com"
        }];
      }
    }
    
    // Handle single object
    if (typeof result === 'object' && result !== null) {
      const normalized = normalizeResult(result);
      return normalized ? [normalized] : [];
    }
    
    return [];
  };

  // Helper function to normalize a result object
  const normalizeResult = (item: any) => {
    if (!item) return null;
    
    // If it's not an object, try to make sense of it
    if (typeof item !== 'object') {
      const str = String(item);
      
      // If it looks like a URL, make it a result
      if (str.startsWith('http')) {
        return {
          title: "Search Result",
          url: str,
          snippet: "Link found in search results",
          domain: extractDomain(str)
        };
      }
      
      // Otherwise skip it
      return null;
    }

    // Extract clean values, ensuring no nested JSON
    const title = cleanTextValue(item.title || item.name || item.heading) || "Search Result";
    const url = cleanUrlValue(item.url || item.link || item.href) || "https://google.com";
    const snippet = cleanTextValue(item.snippet || item.description || item.summary || item.content) || "";
    const domain = item.domain || extractDomain(url);

    return {
      title: title.substring(0, 100), // Limit title length
      url: url,
      snippet: snippet.substring(0, 200), // Limit snippet length
      domain: domain
    };
  };

  // Helper to clean text values and prevent JSON display
  const cleanTextValue = (value: any): string => {
    if (typeof value !== 'string') {
      return String(value || '');
    }
    
    // Remove any markdown formatting
    return value
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
      .replace(/[*_`#]/g, '') // Remove markdown formatting
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
  };

  // Helper to clean URL values
  const cleanUrlValue = (value: any): string => {
    if (typeof value !== 'string') return '';
    
    // Ensure it's a valid HTTP URL
    if (value.startsWith('http')) {
      return value.split(' ')[0]; // Take only the first URL if multiple
    }
    
    return '';
  };

  // Function to handle web search click
  const handleWebSearchClick = (toolCall: ToolCall) => {
    const query = typeof toolCall.parameters === 'string' 
      ? toolCall.parameters 
      : toolCall.parameters?.query || 'search query';
    
    const results = parseSearchResults(toolCall.result);
    
    setSelectedSearchResult({
      query,
      results
    });
    
    setSearchModalVisible(true);
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <>
    <View style={styles.toolCallsContainer}>
      {toolCalls.map((toolCall, index) => {
        const isWebSearch = toolCall.name.toLowerCase().includes('web_search') || 
                           toolCall.name.toLowerCase().includes('websearch');
        
        const ToolContainer = isWebSearch ? TouchableOpacity : View;
        
        return (
          <ToolContainer 
            key={toolCall.id || index} 
            style={[
              styles.toolCallItem,
              getGlassmorphicStyle('card', theme),
              {
                backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f8fafc',
                borderColor: theme === 'dark' ? '#2a2a2a' : '#e2e8f0',
              }
            ]}
            {...(isWebSearch && {
              onPress: () => handleWebSearchClick(toolCall),
              activeOpacity: 0.7
            })}
          >
          <View style={styles.toolCallHeader}>
            <View style={styles.toolCallInfo}>
              <FontAwesome5
                name={getToolIcon(toolCall.name)}
                size={14}
                color={theme === 'dark' ? designTokens.semanticDark.info : designTokens.semantic.info}
                style={styles.toolIcon}
              />
              <Text style={[
                styles.toolCallName,
                { color: theme === 'dark' ? '#f9fafb' : '#1f2937' }
              ]}>
                {getToolLabel(toolCall.name)}
              </Text>
            </View>
            <View style={styles.toolCallStatus}>
              <FontAwesome5
                name={getStatusIcon(toolCall.status)}
                size={12}
                color={getStatusColor(toolCall.status)}
              />
              <Text style={[
                styles.toolCallStatusText,
                { color: getStatusColor(toolCall.status) }
              ]}>
                {toolCall.status}
              </Text>
            </View>
          </View>
          
          {/* For web search, don't show raw parameters/results - use modal instead */}
          {!isWebSearch && toolCall.parameters && Object.keys(toolCall.parameters).length > 0 && (
            <View style={styles.toolCallParams}>
              <Text style={[
                styles.toolCallParamsLabel,
                { color: themeColors.textSecondary }
              ]}>
                Parameters:
              </Text>
              <Text style={[
                styles.toolCallParamsText,
                { color: themeColors.textSecondary }
              ]}>
                {typeof toolCall.parameters === 'string' 
                  ? toolCall.parameters 
                  : JSON.stringify(toolCall.parameters, null, 2)
                }
              </Text>
            </View>
          )}
          
          {/* For web search, show enhanced summary with preview */}
          {isWebSearch && toolCall.result && toolCall.status === 'completed' && (
            <View style={styles.toolCallSummary}>
              <View style={styles.searchSummaryHeader}>
                <FontAwesome5
                  name="search"
                  size={10}
                  color={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                />
                <Text style={[
                  styles.searchSummaryCount,
                  { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }
                ]}>
                  {(() => {
                    const results = parseSearchResults(toolCall.result);
                    return `${results.length} result${results.length !== 1 ? 's' : ''} found`;
                  })()}
                </Text>
              </View>
              {(() => {
                const results = parseSearchResults(toolCall.result);
                const topResult = results[0];
                return topResult ? (
                  <View style={styles.topResultPreview}>
                    <Text style={[
                      styles.previewTitle,
                      { color: theme === 'dark' ? '#bdc1c6' : '#4d5156' }
                    ]} numberOfLines={1}>
                      {topResult.title}
                    </Text>
                    <Text style={[
                      styles.previewDomain,
                      { color: theme === 'dark' ? '#9ca3af' : '#70757a' }
                    ]}>
                      {topResult.domain}
                    </Text>
                  </View>
                ) : null;
              })()}
            </View>
          )}
          
          {/* For non-web search tools, show results normally */}
          {!isWebSearch && toolCall.result && toolCall.status === 'completed' && (
            <View style={styles.toolCallResult}>
              <Text style={[
                styles.toolCallResultLabel,
                { color: themeColors.text }
              ]}>
                Result:
              </Text>
              <Text style={[
                styles.toolCallResultText,
                { color: themeColors.textSecondary }
              ]}>
                {typeof toolCall.result === 'string' 
                  ? toolCall.result 
                  : JSON.stringify(toolCall.result, null, 2)
                }
              </Text>
            </View>
          )}
          
          {/* Visual indicator for clickable web search */}
          {isWebSearch && (
            <View style={styles.clickableIndicator}>
              <FontAwesome5
                name="external-link-alt"
                size={10}
                color={theme === 'dark' ? designTokens.semanticDark.info : designTokens.semantic.info}
              />
              <Text style={[
                styles.clickableText,
                { color: theme === 'dark' ? designTokens.semanticDark.info : designTokens.semantic.info }
              ]}>
                Tap to view results
              </Text>
            </View>
          )}
        </ToolContainer>
        );
      })}
    </View>
    </>
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


  const getSystemBubbleStyles = () => {
    return [
      getGlassmorphicStyle('card', theme as 'light' | 'dark'),
      getStandardBorder(theme),
      styles.systemBubble,
      {
        backgroundColor: designTokens.pastels.cyan + '40',
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
            
            {/* Small Profile Bubble */}
            {message.text?.trim() && (
              <Animated.View style={[
                styles.userProfileBubble,
                getStandardBorder(theme),
                {
                  backgroundColor: getUserMessageColor(messageIndex, theme, colorfulBubblesEnabled),
                  transform: [{ scale: pressAnim }],
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
                      flexWrap: 'wrap',
                      flexShrink: 1,
                      maxWidth: '100%',
                    }
                  ]}
                  numberOfLines={0}
                  ellipsizeMode="clip"
                >
                  {message.text}
                </Text>
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
                getSystemBubbleStyles(),
                {
                  transform: [{ scale: pressAnim }],
                }
              ]}>
                <Text style={[
                  styles.systemMessageText,
                  {
                    fontSize: 16,
                    lineHeight: 24,
                    letterSpacing: -0.1,
                    fontFamily: 'Nunito-Medium',
                    fontWeight: '500',
                    color: designTokens.brand.primary,
                    textAlign: 'center',
                  }
                ]}>
                  {message.text}
                </Text>
              </Animated.View>
            ) : (
              // Bot messages - no bubble, just clean text
              <View style={styles.botTextWrapper}>
                <BotMessageContent 
                  text={message.text}
                  theme={theme}
                  messageId={message.id}
                  isStreaming={message.variant === 'streaming'}
                />
              </View>
            )}
            
            {/* Search Sources Section */}
            {message.metadata?.searchResults && message.metadata?.sources && message.metadata.sources.length > 0 && !isSystem && (
              <View style={[
                styles.sourcesContainer,
                {
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                  borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                }
              ]}>
                <View style={styles.sourcesHeader}>
                  <FontAwesome5
                    name="search"
                    size={12}
                    color={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                  />
                  <Text style={[
                    styles.sourcesTitle,
                    { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }
                  ]}>
                    Sources
                  </Text>
                </View>
                <View style={styles.sourcesList}>
                  {message.metadata.sources.slice(0, 3).map((source, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.sourceItem,
                        {
                          backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        }
                      ]}
                      onPress={() => {
                        try {
                          require('expo-linking').openURL(source.url);
                        } catch (error) {
                          console.warn('Failed to open URL:', error);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.sourceContent}>
                        <Text 
                          style={[
                            styles.sourceTitle,
                            { color: theme === 'dark' ? '#e5e7eb' : '#374151' }
                          ]}
                          numberOfLines={1}
                        >
                          {source.title}
                        </Text>
                        <Text 
                          style={[
                            styles.sourceDomain,
                            { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }
                          ]}
                          numberOfLines={1}
                        >
                          {source.domain}
                        </Text>
                      </View>
                      <FontAwesome5
                        name="external-link-alt"
                        size={10}
                        color={theme === 'dark' ? '#6b7280' : '#9ca3af'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            {/* Tool Calls Section */}
            {(() => {
              const hasToolCalls = message.metadata?.toolCalls && message.metadata.toolCalls.length > 0;
              
              return hasToolCalls && !isSystem ? (
                <ToolCallDisplay 
                  toolCalls={message.metadata?.toolCalls || []}
                  theme={theme}
                />
              ) : null;
            })()}
            
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
                  {message.aiInsight.suggestion}
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
    marginVertical: spacing[1] / 4,
    marginHorizontal: 0,
    overflow: 'visible',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
  },
  messageWrapper: {
    maxWidth: width * 0.95,
  },
  userMessageWrapper: {
    maxWidth: width * 0.85,
    alignSelf: 'flex-end',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    gap: spacing[1] / 4,
    width: '100%',
    overflow: 'visible',
  },
  botMessageContainer: {
    width: '100%',
    paddingHorizontal: spacing[1] / 2,
    position: 'relative',
  },
  botTextContainer: {
    width: '100%',
    position: 'relative',
  },
  lottieAnimation: {
    width: 100,
    height: 96,
    alignSelf: 'flex-start',
    marginLeft: -8,
  },
  userProfileBubble: {
    borderRadius: 12,
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: spacing[1] + 2,
    marginVertical: spacing[1] / 2,
    maxWidth: '92%',
    minWidth: 50,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexShrink: 1,
  },
  botTextWrapper: {
    marginVertical: spacing[1] / 2,
    paddingHorizontal: spacing[1] / 2,
    maxWidth: width * 0.95, // Stretch much further right
    alignSelf: 'flex-start',
  },
  systemBubble: {
    borderRadius: 16,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    marginVertical: spacing[1],
    marginHorizontal: spacing[6],
    alignSelf: 'center',
  },
  textContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  messageText: {
    // Typography now handled inline for better control
    flexShrink: 1,
    flexWrap: 'wrap',
    width: '100%',
  },
  systemMessageText: {
    // Typography now handled inline for better control
  },
  streamingCursor: {
    opacity: 0.8,
    fontWeight: '500',
    marginLeft: 1,
  },
  userTimestamp: {
    textAlign: 'right',
    marginTop: spacing[1] / 4,
  },
  aiMessageTimestamp: {
    alignSelf: 'flex-start',
    marginTop: spacing[1],
    marginLeft: spacing[1] / 4,
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
  // Search Sources Styles
  sourcesContainer: {
    marginTop: spacing[2],
    borderTopWidth: 1,
    paddingTop: spacing[2],
    paddingHorizontal: spacing[1],
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
    gap: spacing[1],
  },
  sourcesTitle: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourcesList: {
    gap: spacing[1],
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] + 2,
    borderRadius: 8,
  },
  sourceContent: {
    flex: 1,
    marginRight: spacing[2],
  },
  sourceTitle: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Nunito-Medium',
    marginBottom: 2,
  },
  sourceDomain: {
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'Nunito-Regular',
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

  // Tool Call Styles
  toolCallsContainer: {
    marginTop: spacing[2],
    marginBottom: spacing[1],
    gap: spacing[2],
  },
  toolCallItem: {
    borderRadius: 10,
    borderWidth: 1,
    padding: spacing[2],
    marginHorizontal: spacing[1] / 2,
  },
  toolCallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  toolCallInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toolIcon: {
    marginRight: spacing[1],
  },
  toolCallName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
  toolCallStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1] / 2,
  },
  toolCallStatusText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  toolCallParams: {
    marginTop: spacing[1],
    paddingTop: spacing[1],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  toolCallParamsLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing[1] / 2,
  },
  toolCallParamsText: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  toolCallResult: {
    marginTop: spacing[1],
    paddingTop: spacing[1],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  toolCallResultLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing[1] / 2,
  },
  toolCallResultText: {
    fontSize: 11,
    lineHeight: 16,
    maxHeight: 100,
    overflow: 'hidden',
  },
  toolCallSummary: {
    marginTop: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  searchSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[1],
  },
  searchSummaryCount: {
    fontSize: 11,
    fontFamily: 'SF Pro Text',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  topResultPreview: {
    marginTop: spacing[1],
    paddingLeft: spacing[3],
  },
  previewTitle: {
    fontSize: 12,
    fontFamily: 'SF Pro Text',
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: spacing[1] / 2,
  },
  previewDomain: {
    fontSize: 10,
    fontFamily: 'SF Pro Text',
    fontWeight: '400',
    letterSpacing: 0.2,
    opacity: 0.8,
  },
  clickableIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
    paddingTop: spacing[1],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: spacing[1],
  },
  clickableText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Nunito-Medium',
  },
});

export default EnhancedMessageBubble;