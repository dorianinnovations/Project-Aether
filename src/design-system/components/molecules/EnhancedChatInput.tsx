/**
 * Aether Design System - Enhanced Chat Input Component
 * Sophisticated chat input with advanced features from numina-mobile
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  Platform,
  StyleSheet,
  Dimensions,
  Text,
  Easing,
  Alert,
} from 'react-native';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { designTokens, getThemeColors, getComponentBorder, getUserMessageColor } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing, borderRadius } from '../../tokens/spacing';
import { getNeumorphicStyle } from '../../tokens/shadows';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';

const { width } = Dimensions.get('window');

// Import the centralized LottieLoader
import { LottieLoader } from '../atoms';

interface MessageAttachment {
  id: string;
  type: 'image' | 'document';
  name: string;
  uri: string;
  size: number;
  uploadStatus: 'pending' | 'uploaded' | 'error';
  mimeType?: string;
}

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: (attachments?: MessageAttachment[]) => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  placeholder?: string;
  theme?: 'light' | 'dark';
  isLoading?: boolean;
  maxLength?: number;
  nextMessageIndex?: number;
  voiceEnabled?: boolean;
  enableFileUpload?: boolean;
  maxAttachments?: number;
  attachments?: MessageAttachment[];
  onAttachmentsChange?: (attachments: MessageAttachment[]) => void;
  isTabBarHidden?: boolean;
  colorfulBubblesEnabled?: boolean;
}

export const EnhancedChatInput: React.FC<ChatInputProps> = ({
  value,
  onChangeText,
  onSend,
  onVoiceStart,
  onVoiceEnd,
  isLoading = false,
  maxLength = 500,
  placeholder = "Ask Numina anything...",
  voiceEnabled = true,
  theme = 'light',
  nextMessageIndex = 0,
  enableFileUpload = true,
  maxAttachments = 5,
  attachments = [],
  onAttachmentsChange,
  colorfulBubblesEnabled = false,
}) => {
  const themeColors = getThemeColors(theme);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentButtonsVisible, setAttachmentButtonsVisible] = useState(false);
  
  // Animated values for smooth animations
  const voiceAnimScale = useRef(new Animated.Value(1)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const attachmentButtonsAnim = useRef(new Animated.Value(0)).current;
  
  // Computed values
  const isInputEmpty = !value.trim();
  const hasAttachments = attachments.length > 0;
  const canSend = (!isInputEmpty || hasAttachments) && !isLoading && !isUploading;
  const hasImageOnlyMessage = isInputEmpty && attachments.some(att => att.type === 'image');

  // Voice recording animation
  useEffect(() => {
    if (isVoiceActive) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isVoiceActive]);

  const handleVoicePress = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isVoiceActive) {
      setIsVoiceActive(false);
      onVoiceEnd?.();
      
      Animated.spring(voiceAnimScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      setIsVoiceActive(true);
      onVoiceStart?.();
      
      Animated.spring(voiceAnimScale, {
        toValue: 1.1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [isVoiceActive, onVoiceEnd, onVoiceStart, voiceAnimScale]);

  const handleSendPress = useCallback(async () => {
    if (!canSend) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.spring(sendButtonScale, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start(() => {
      Animated.spring(sendButtonScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }).start();
    });

    onSend(attachments);
  }, [canSend, sendButtonScale, onSend, attachments]);

  const handleRemoveAttachment = (attachmentId: string) => {
    if (onAttachmentsChange) {
      const newAttachments = attachments.filter(a => a.id !== attachmentId);
      onAttachmentsChange(newAttachments);
    }
  };

  const handleCameraPress = async () => {
    if (!enableFileUpload) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttachmentButtonsVisible(false);

    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Camera Permission', 'Please enable camera access to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        await handleNewAttachment(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Camera Error', 'Unable to access camera. Please try again.');
    }
  };

  const handleGalleryPress = async () => {
    if (!enableFileUpload) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttachmentButtonsVisible(false);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        allowsMultipleSelection: true,
        selectionLimit: Math.min(5, maxAttachments - attachments.length),
      });

      if (!result.canceled && result.assets?.length > 0) {
        for (const asset of result.assets) {
          await handleNewAttachment(asset);
        }
      }
    } catch (error) {
      Alert.alert('Gallery Error', 'Unable to access photo library. Please try again.');
    }
  };

  const handleDocumentPress = async () => {
    if (!enableFileUpload) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttachmentButtonsVisible(false);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        await handleNewAttachment(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Document Error', 'Unable to select document. Please try again.');
    }
  };

  const handleNewAttachment = async (asset: any) => {
    if (attachments.length >= maxAttachments) {
      Alert.alert('Attachment Limit', `You can attach up to ${maxAttachments} files.`);
      return;
    }

    const newAttachment: MessageAttachment = {
      id: Date.now().toString(),
      type: asset.type?.includes('image') ? 'image' : 'document',
      name: asset.name || `attachment_${Date.now()}`,
      uri: asset.uri,
      size: asset.fileSize || 0,
      uploadStatus: 'pending',
      mimeType: asset.mimeType || 'application/octet-stream',
    };

    if (onAttachmentsChange) {
      onAttachmentsChange([...attachments, newAttachment]);
    }
  };

  const toggleAttachmentButtons = useCallback(() => {
    const newVisibility = !attachmentButtonsVisible;
    
    // ENHANCED HAPTIC FEEDBACK FOR MORPHING
    if (newVisibility) {
      // Opening - Medium impact for "expansion"
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      // Closing - Light impact for "contraction"
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setAttachmentButtonsVisible(newVisibility);
    
    // SMOOTHER SPRING ANIMATION
    Animated.spring(attachmentButtonsAnim, {
      toValue: newVisibility ? 1 : 0,
      useNativeDriver: false,
      tension: 220, // Slightly more snappy
      friction: 10,  // Less friction for smoother motion
    }).start();
  }, [attachmentButtonsVisible, attachmentButtonsAnim]);

  const handleInputFocus = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.timing(inputFocusAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [inputFocusAnim]);

  const handleInputBlur = useCallback(() => {
    Animated.timing(inputFocusAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [inputFocusAnim]);

  return (
    <View style={styles.container}>
      {/* Character Count */}
      {value.length > maxLength * 0.8 && (
        <View style={styles.characterCount}>
          <Text style={[
            styles.characterCountText,
            typography.textStyles.caption,
            {
              color: value.length >= maxLength 
                ? designTokens.semantic.error
                : themeColors.textMuted,
            }
          ]}>
            {value.length}/{maxLength}
          </Text>
        </View>
      )}

      {/* Floating Input Container */}
      <Animated.View style={[
        styles.floatingContainer,
        getGlassmorphicStyle('input', theme),
        {
          borderColor: themeColors.borders.default,
          borderWidth: 1,
          borderBottomWidth: attachmentButtonsAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
          borderBottomLeftRadius: attachmentButtonsAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [16, 0],
          }),
          borderBottomRightRadius: attachmentButtonsAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [16, 0],
          }),
          // ELASTIC STRETCHING EFFECT
          height: attachmentButtonsAnim.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [68, 75, 68], // Slight stretch then back
          }),
          // SHADOW CONTINUITY FOR DEPTH ILLUSION
          shadowRadius: attachmentButtonsAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [4, 12], // Deeper shadow when "expanded"
          }),
          shadowOpacity: attachmentButtonsAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.1, 0.25], // More prominent shadow
          }),
          elevation: attachmentButtonsAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [2, 8], // Android shadow elevation
          }),
          // SUBTLE VERTICAL SHIFT - Creates "magnetic pull" effect
          transform: [{
            translateY: attachmentButtonsAnim.interpolate({
              inputRange: [0, 0.4, 1],
              outputRange: [0, -2, 0], // Slight upward pull then settle
            })
          }],
          // Removed background glow - let glassmorphic style handle it
        }
      ]}>
        <View style={styles.inputRow}>
          {/* Text Input */}
          <Animated.View style={[
            styles.inputContainer,
            {
              backgroundColor: 'transparent',
            }
          ]}>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: themeColors.text,
                }
              ]}
              value={value}
              onChangeText={(text) => {
                if (text.endsWith('\n')) {
                  const messageText = text.slice(0, -1);
                  onChangeText(messageText);
                  handleSendPress();
                } else {
                  onChangeText(text);
                }
              }}
              placeholder={hasImageOnlyMessage ? "Image ready to analyze..." : placeholder}
              placeholderTextColor={themeColors.textMuted}
              keyboardAppearance={theme}
              multiline={true}
              numberOfLines={1}
              maxLength={maxLength}
              onSubmitEditing={handleSendPress}
              returnKeyType="send"
              blurOnSubmit={false}
              scrollEnabled={true}
              textBreakStrategy="balanced"
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              editable={!isLoading}
              textAlignVertical="center"
            />
          </Animated.View>

          {/* Attachment Button */}
          {enableFileUpload && (
            <TouchableOpacity
              style={styles.attachmentToggleButton}
              onPress={toggleAttachmentButtons}
              activeOpacity={0.7}
            >
              <FontAwesome5 
                name={attachmentButtonsVisible ? "times" : "paperclip"} 
                size={16} 
                color={themeColors.textSecondary} 
              />
            </TouchableOpacity>
          )}

          {/* Voice Button */}
          {voiceEnabled && isInputEmpty && !hasAttachments && (
            <Animated.View style={[
              styles.voiceButton,
              { transform: [{ scale: voiceAnimScale }] }
            ]}>
              <TouchableOpacity
                onPress={handleVoicePress}
                activeOpacity={0.7}
                style={styles.voiceButtonInner}
              >
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <FontAwesome5
                    name="microphone"
                    size={16}
                    color={isVoiceActive ? designTokens.semantic.error : themeColors.textSecondary}
                  />
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Send Button */}
          <View style={styles.sendButtonContainer}>
            <TouchableOpacity
              onPress={handleSendPress}
              disabled={!canSend}
              activeOpacity={0.7}
              style={styles.sendButtonContainer}
            >
              <Animated.View style={[
                styles.sendButton,
                getNeumorphicStyle('elevated', theme),
                {
                  backgroundColor: canSend
                    ? getUserMessageColor(nextMessageIndex, theme, colorfulBubblesEnabled)
                    : themeColors.surface,
                  transform: [{ scale: sendButtonScale }],
                }
              ]}>
                {isLoading || isUploading ? (
                  <LottieLoader size={25} />
                ) : (
                  <FontAwesome5
                    name={hasImageOnlyMessage ? "eye" : "arrow-up"}
                    size={18}
                    color={canSend ? '#1DA1F2' : themeColors.textMuted}
                  />
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Voice Recording Indicator */}
      {isVoiceActive && (
        <Animated.View style={[
          styles.voiceIndicator,
          getGlassmorphicStyle('card', theme),
        ]}>
          <View style={styles.voiceIndicatorContent}>
            <Animated.View style={[
              styles.voiceRecordingDot,
              { transform: [{ scale: pulseAnim }] }
            ]} />
            <Text style={[
              styles.voiceIndicatorText,
              typography.textStyles.caption,
              { color: themeColors.text }
            ]}>
              Listening...
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Attachment Buttons */}
      {enableFileUpload && (
        <Animated.View style={[
          styles.attachmentButtonsContainer,
          getGlassmorphicStyle('input', theme),
          {
            opacity: attachmentButtonsAnim,
            height: attachmentButtonsAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 60],
            }),
            transform: [
              { scaleY: attachmentButtonsAnim },
              // SUBTLE UNFOLD ROTATION
              { 
                rotateX: attachmentButtonsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['15deg', '0deg'], // Unfolds from tilted
                })
              }
            ],
            marginBottom: attachmentButtonsVisible ? spacing[4] : 0,
            borderColor: themeColors.borders.default,
            borderTopWidth: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          }
        ]}>
          {attachmentButtonsVisible && (
            <>
              {/* Camera Button */}
              <TouchableOpacity
                style={[
                  styles.attachmentButton,
                  {
                    backgroundColor: 'rgba(100, 149, 237, 0.1)',
                    borderColor: 'rgba(100, 149, 237, 0.2)',
                  }
                ]}
                onPress={handleCameraPress}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="camera" size={16} color="#6495ed" />
                <Text style={[
                  styles.attachmentButtonText,
                  typography.textStyles.caption,
                  { color: '#6495ed' }
                ]}>Camera</Text>
              </TouchableOpacity>

              {/* Gallery Button */}
              <TouchableOpacity
                style={[
                  styles.attachmentButton,
                  {
                    backgroundColor: 'rgba(147, 112, 219, 0.1)',
                    borderColor: 'rgba(147, 112, 219, 0.2)',
                  }
                ]}
                onPress={handleGalleryPress}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="image" size={16} color="#9370db" />
                <Text style={[
                  styles.attachmentButtonText,
                  typography.textStyles.caption,
                  { color: '#9370db' }
                ]}>Gallery</Text>
              </TouchableOpacity>

              {/* Document Button */}
              <TouchableOpacity
                style={[
                  styles.attachmentButton,
                  {
                    backgroundColor: 'rgba(255, 140, 0, 0.1)',
                    borderColor: 'rgba(255, 140, 0, 0.2)',
                  }
                ]}
                onPress={handleDocumentPress}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="file-alt" size={16} color="#ff8c00" />
                <Text style={[
                  styles.attachmentButtonText,
                  typography.textStyles.caption,
                  { color: '#ff8c00' }
                ]}>Files</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      )}

      {/* Attachment Preview */}
      {hasAttachments && (
        <View style={styles.attachmentsList}>
          {attachments.map((attachment) => (
            <View key={attachment.id} style={[
              styles.attachmentItem,
              getNeumorphicStyle('subtle', theme)
            ]}>
              <Text style={[
                styles.attachmentName,
                typography.textStyles.bodySmall,
                { color: themeColors.text }
              ]}>
                {attachment.name}
              </Text>
              <TouchableOpacity
                onPress={() => handleRemoveAttachment(attachment.id)}
                style={styles.removeAttachmentButton}
              >
                <FontAwesome5 name="times" size={12} color={themeColors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[2],
    paddingTop: 0,
    paddingVertical: 0,
    paddingBottom: 0,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  characterCount: {
    alignItems: 'flex-end',
    paddingBottom: spacing[2],
    paddingRight: spacing[1],
  },
  characterCountText: {
    letterSpacing: -0.2,
  },
  floatingContainer: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[3],
    position: 'relative',
    overflow: 'hidden',
    height: 68, 
    minHeight: 68,
    maxHeight: 68,
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    position: 'relative',
  },
  inputContainer: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: spacing[3],
    paddingVertical: 2,
    height: 44,
    minHeight: 44,
    maxHeight: 44,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  textInput: {
    height: 44,
    minHeight: 44,
    maxHeight: 44,
    paddingVertical: 1,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.2,
    fontFamily: 'Nunito-Regular',
    fontWeight: '400',
    textAlign: 'left',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  attachmentToggleButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    // Remove marginBottom for alignment
  },
  voiceButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonContainer: {
    // Remove marginBottom for alignment
  },
  sendButton: {
    width: 60,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[1],
  },
  voiceIndicator: {
    position: 'absolute',
    top: -48,
    left: spacing[5],
    right: spacing[5],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: 16,
  },
  voiceIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  voiceRecordingDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: '#86efac',
  },
  voiceIndicatorText: {
    letterSpacing: -0.2,
  },
  attachmentButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: 12,
    marginHorizontal: 0,
    borderWidth: 1,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing[2],
    minWidth: 90,
    justifyContent: 'center',
  },
  attachmentButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  attachmentsList: {
    marginTop: spacing[2],
    gap: spacing[2],
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 8,
    marginHorizontal: spacing[2],
  },
  attachmentName: {
    flex: 1,
  },
  removeAttachmentButton: {
    padding: spacing[1],
  },
});

export default EnhancedChatInput;