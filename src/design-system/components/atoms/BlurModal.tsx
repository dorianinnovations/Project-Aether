/**
 * Aether BlurModal Component
 * Generic reusable modal with glassmorphic blur effect
 * Features: Real blur background, snappy animations, theme support, haptic feedback, fully customizable
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Dimensions,
  Easing,
  BackHandler,
  Platform,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { FontAwesome5 } from '@expo/vector-icons';
import { designTokens, getThemeColors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface BlurModalProps {
  visible: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  
  // Content props
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  
  // Icon props
  icon?: string;
  iconColor?: string;
  iconLibrary?: 'FontAwesome5';
  showIcon?: boolean;
  
  // Button props
  buttonText?: string;
  buttonColor?: string;
  onButtonPress?: () => void;
  showButton?: boolean;
  
  // Styling props
  width?: number;
  maxHeight?: number;
  minHeight?: number;
  borderRadius?: number;
  blurIntensity?: number;
  
  // Behavior props
  closeOnBackdropPress?: boolean;
  showCloseButton?: boolean;
}

export const BlurModal: React.FC<BlurModalProps> = ({
  visible,
  onClose,
  theme = 'light',
  
  // Content
  children,
  title,
  subtitle,
  
  // Icon
  icon = 'info-circle',
  iconColor,
  iconLibrary = 'FontAwesome5',
  showIcon = true,
  
  // Button
  buttonText = 'Got it',
  buttonColor,
  onButtonPress,
  showButton = true,
  
  // Styling
  width,
  maxHeight = screenHeight * 0.8,
  minHeight = 400,
  borderRadius = 10,
  blurIntensity,
  
  // Behavior
  closeOnBackdropPress = true,
  showCloseButton = false,
}) => {
  const themeColors = getThemeColors(theme);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(visible);
  
  // Animation values
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(50)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const iconScale = useRef(new Animated.Value(0)).current;

  // Cleanup animations
  const resetAnimations = useCallback(() => {
    backgroundOpacity.setValue(0);
    modalScale.setValue(0.8);
    modalOpacity.setValue(0);
    modalTranslateY.setValue(50);
    iconScale.setValue(0);
    buttonScale.setValue(1);
    setIsAnimating(false);
  }, []);

  // Show animation - Optimized for snappy performance
  const showModal = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    resetAnimations();
    
    // Background fade in - faster
    Animated.timing(backgroundOpacity, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
    
    // Modal entrance with spring effect - snappier
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        tension: 200,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.spring(modalTranslateY, {
        toValue: 0,
        tension: 200,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Icon bounce animation - much faster
      if (showIcon) {
        Animated.sequence([
          Animated.spring(iconScale, {
            toValue: 1.1,
            tension: 300,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(iconScale, {
            toValue: 1,
            tension: 300,
            friction: 10,
            useNativeDriver: true,
          }),
        ]).start();
      }
      
      setIsAnimating(false);
    });
  }, [isAnimating, resetAnimations, showIcon]);

  // Hide animation - Fast exit for responsive feel
  const hideModal = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Super fast exit animation
    Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 80,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
      Animated.timing(modalTranslateY, {
        toValue: 20,
        duration: 80,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
    ]).start(() => {
      resetAnimations();
    });
  }, [isAnimating, resetAnimations]);

  // Effect to handle render state timing
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
    } else {
      // Delay unmounting to allow exit animation to complete
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Effect to handle visibility changes - use setTimeout to avoid insertion effect warnings
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => showModal(), 0);
      return () => clearTimeout(timer);
    } else {
      hideModal();
    }
  }, [visible, showModal, hideModal]);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS === 'android' && visible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!isAnimating) {
          handleClose();
        }
        return true;
      });
      return () => backHandler.remove();
    }
  }, [visible, isAnimating]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetAnimations();
    };
  }, [resetAnimations]);

  const handleClose = () => {
    if (isAnimating) return;
    onClose();
  };

  const handleBackdropPress = () => {
    if (closeOnBackdropPress && !isAnimating) {
      handleClose();
    }
  };

  const handleButtonPress = () => {
    if (isAnimating) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Quick button feedback animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.96,
        duration: 30,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onButtonPress) {
        onButtonPress();
      } else {
        onClose();
      }
    });
  };

  if (!shouldRender) return null;

  const finalIconColor = iconColor || designTokens.brand.primary;
  const finalButtonColor = buttonColor || designTokens.brand.primary;
  const finalBlurIntensity = blurIntensity || (theme === 'dark' ? 50 : 40);
  const finalWidth = width || Math.min(screenWidth - spacing[6], 360);

  return (
    <Modal
      transparent
      visible={shouldRender}
      statusBarTranslucent
      animationType="none"
    >
      <View style={styles.overlay}>
        {/* Background */}
        <Animated.View
          style={[
            styles.background,
            {
              opacity: backgroundOpacity,
              backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            }
          ]}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={handleBackdropPress}
            disabled={isAnimating}
          />
        </Animated.View>

        {/* Modal Content */}
        <View style={styles.modalContainer}>
          <Animated.View
            style={[
              styles.modalWrapper,
              {
                width: finalWidth,
                maxHeight,
                borderRadius,
                opacity: modalOpacity,
                transform: [
                  { scale: modalScale },
                  { translateY: modalTranslateY }
                ],
              }
            ]}
          >
            <BlurView
              intensity={finalBlurIntensity}
              tint={theme === 'dark' ? 'dark' : 'light'}
              style={[styles.modal, { minHeight }]}
            >
              {/* Close button */}
              {showCloseButton && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  disabled={isAnimating}
                >
                  <FontAwesome5 name="times" size={16} color={themeColors.textMuted} />
                </TouchableOpacity>
              )}

              {/* Icon */}
              {showIcon && (
                <Animated.View style={[
                  styles.iconContainer,
                  {
                    backgroundColor: finalIconColor + '15',
                    borderColor: finalIconColor + '30',
                    transform: [{ scale: iconScale }],
                  }
                ]}>
                  <FontAwesome5
                    name={icon}
                    size={24}
                    color={finalIconColor}
                  />
                </Animated.View>
              )}

              {/* Title */}
              {title && (
                <Text style={[
                  styles.title,
                  typography.textStyles.headlineSmall,
                  { color: themeColors.text }
                ]}>
                  {title}
                </Text>
              )}

              {/* Subtitle */}
              {subtitle && (
                <Text style={[
                  styles.subtitle,
                  typography.textStyles.bodyMedium,
                  { color: themeColors.textSecondary }
                ]}>
                  {subtitle}
                </Text>
              )}

              {/* Content */}
              {children && (
                <ScrollView 
                  style={styles.contentContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {children}
                </ScrollView>
              )}

              {/* Button */}
              {showButton && (
                <Animated.View style={[
                  styles.actionButton,
                  {
                    backgroundColor: finalButtonColor,
                    transform: [{ scale: buttonScale }],
                  }
                ]}>
                  <TouchableOpacity
                    onPress={handleButtonPress}
                    disabled={isAnimating}
                    style={styles.buttonInner}
                  >
                    <Text style={[
                      styles.buttonText,
                      typography.textStyles.bodyMedium,
                      { color: '#ffffff' }
                    ]}>
                      {buttonText}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </BlurView>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Layout containers
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  
  // Modal glassmorphic styling
  modalWrapper: {
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modal: {
    padding: spacing[6],
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  
  // Close button
  closeButton: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  
  // Content styling
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
    borderWidth: 1,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing[4],
  },
  contentContainer: {
    width: '100%',
    maxHeight: 200,
    marginBottom: spacing[5],
  },
  actionButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  buttonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '700',
  },
});

export default BlurModal;