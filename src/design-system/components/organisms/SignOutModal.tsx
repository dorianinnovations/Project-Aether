/**
 * Aether SignOut Modal Component
 * Reusable modal that can be adapted for various confirmation dialogs
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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { designTokens, getThemeColors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import { getNeumorphicStyle } from '../../tokens/shadows';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SignOutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  theme?: 'light' | 'dark';
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
  iconLibrary?: 'FontAwesome5' | 'Feather';
  variant?: 'danger' | 'warning' | 'info' | 'success';
  showIcon?: boolean;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({
  visible,
  onClose,
  onConfirm,
  theme = 'light',
  title = 'Sign Out',
  message = 'Are you sure you want to sign out of your account?',
  confirmText = 'Sign Out',
  cancelText = 'Cancel',
  icon = 'sign-out-alt',
  iconLibrary = 'FontAwesome5',
  variant = 'danger',
  showIcon = true,
}) => {
  const themeColors = getThemeColors(theme);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Main modal animations
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(50)).current;
  
  // Button animations
  const confirmButtonScale = useRef(new Animated.Value(1)).current;
  const cancelButtonScale = useRef(new Animated.Value(1)).current;
  
  // Icon animation
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;

  // Cleanup animations
  const resetAnimations = useCallback(() => {
    backgroundOpacity.setValue(0);
    modalScale.setValue(0.8);
    modalOpacity.setValue(0);
    modalTranslateY.setValue(50);
    iconScale.setValue(0);
    iconRotation.setValue(0);
    confirmButtonScale.setValue(1);
    cancelButtonScale.setValue(1);
    setIsAnimating(false);
    setIsConfirming(false);
  }, []);

  // Show animation
  const showModal = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    resetAnimations();
    
    // Background fade in
    Animated.timing(backgroundOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    // Modal entrance with spring effect
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.spring(modalTranslateY, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Icon bounce animation
      if (showIcon) {
        Animated.sequence([
          Animated.spring(iconScale, {
            toValue: 1.2,
            tension: 150,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.spring(iconScale, {
            toValue: 1,
            tension: 150,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
        
        // Subtle icon rotation for attention
        Animated.timing(iconRotation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }).start();
      }
      
      setIsAnimating(false);
    });
  }, [isAnimating, resetAnimations]);

  // Hide animation
  const hideModal = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Fast exit animation
    Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
      Animated.timing(modalTranslateY, {
        toValue: 30,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
    ]).start(() => {
      resetAnimations();
    });
  }, [isAnimating, resetAnimations]);

  // Effect to handle visibility changes
  useEffect(() => {
    if (visible) {
      showModal();
    } else {
      hideModal();
    }
  }, [visible, showModal, hideModal]);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS === 'android' && visible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!isAnimating) {
          handleCancel();
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

  const handleCancel = () => {
    if (isAnimating || isConfirming) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.sequence([
      Animated.timing(cancelButtonScale, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(cancelButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleConfirm = () => {
    if (isAnimating || isConfirming) return;
    
    setIsConfirming(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.sequence([
      Animated.timing(confirmButtonScale, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(confirmButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onConfirm();
      setIsConfirming(false);
    });
  };

  const getVariantColor = () => {
    switch (variant) {
      case 'danger': return theme === 'dark' ? '#FF5252' : '#DC2626'; // Bright red for dark, strong red for light
      case 'warning': return designTokens.semantic.warning;
      case 'info': return designTokens.brand.primary;
      case 'success': return designTokens.semantic.success;
      default: return theme === 'dark' ? '#FF5252' : '#DC2626';
    }
  };

  const getVariantIcon = () => {
    switch (variant) {
      case 'danger': return 'exclamation-triangle';
      case 'warning': return 'alert-triangle';
      case 'info': return 'info';
      case 'success': return 'check-circle';
      default: return icon;
    }
  };

  const renderIcon = () => {
    if (!showIcon) return null;
    
    const IconComponent = iconLibrary === 'Feather' ? Feather : FontAwesome5;
    const iconName = variant !== 'danger' ? getVariantIcon() : icon;
    const iconColor = getVariantColor();
    
    const rotation = iconRotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', variant === 'danger' ? '-5deg' : '0deg'],
    });
    
    return (
      <Animated.View style={[
        styles.iconContainer,
        {
          backgroundColor: iconColor + '15',
          borderColor: iconColor + '30',
          transform: [
            { scale: iconScale },
            { rotate: rotation }
          ],
        }
      ]}>
        <IconComponent
          name={iconName as any}
          size={24}
          color={iconColor}
        />
      </Animated.View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
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
              backgroundColor: variant === 'danger' 
                ? (theme === 'dark' ? 'rgba(20, 0, 0, 0.8)' : 'rgba(40, 10, 10, 0.6)')
                : (theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)'),
            }
          ]}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={handleCancel}
            disabled={isAnimating || isConfirming}
          />
        </Animated.View>

        {/* Modal Content */}
        <View style={styles.modalContainer}>
          <Animated.View
            style={[
              styles.modal,
              getGlassmorphicStyle('overlay', theme),
              {
                opacity: modalOpacity,
                transform: [
                  { scale: modalScale },
                  { translateY: modalTranslateY }
                ],
              }
            ]}
          >
            {/* Icon */}
            {renderIcon()}

            {/* Title */}
            <Text style={[
              styles.title,
              typography.textStyles.headlineSmall,
              { color: themeColors.text }
            ]}>
              {title}
            </Text>

            {/* Message */}
            <Text style={[
              styles.message,
              typography.textStyles.bodyMedium,
              { color: themeColors.textSecondary }
            ]}>
              {message}
            </Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {/* Cancel Button */}
              <Animated.View style={[
                styles.button,
                getNeumorphicStyle('subtle', theme),
                {
                  backgroundColor: themeColors.surface,
                  borderWidth: 2,
                  borderColor: theme === 'dark' ? '#404040' : '#E5E5E5',
                  transform: [{ scale: cancelButtonScale }],
                }
              ]}>
                <TouchableOpacity
                  onPress={handleCancel}
                  disabled={isAnimating || isConfirming}
                  style={styles.buttonInner}
                >
                  <Text style={[
                    styles.buttonText,
                    typography.textStyles.bodyMedium,
                    { 
                      color: themeColors.text,
                      fontWeight: '600',
                    }
                  ]}>
                    {cancelText}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Confirm Button */}
              <Animated.View style={[
                styles.button,
                styles.confirmButton,
                getNeumorphicStyle('elevated', theme),
                {
                  backgroundColor: getVariantColor(),
                  borderWidth: 2,
                  borderColor: theme === 'dark' ? '#FF6B6B' : '#B91C1C',
                  shadowColor: getVariantColor(),
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                  transform: [{ scale: confirmButtonScale }],
                }
              ]}>
                <TouchableOpacity
                  onPress={handleConfirm}
                  disabled={isAnimating || isConfirming}
                  style={styles.buttonInner}
                >
                  <Text style={[
                    styles.buttonText,
                    styles.confirmButtonText,
                    typography.textStyles.bodyMedium,
                    { 
                      color: '#ffffff',
                      fontWeight: '700',
                      textShadowColor: 'rgba(0,0,0,0.3)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }
                  ]}>
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    paddingHorizontal: spacing[6],
  },
  modal: {
    width: Math.min(screenWidth - spacing[8], 320),
    borderRadius: 20,
    padding: spacing[6],
    alignItems: 'center',
  },
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
  message: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing[6],
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    width: '100%',
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  confirmButton: {
    // Additional styles for confirm button
  },
  buttonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },
  confirmButtonText: {
    // Additional styles for confirm button text
  },
});

export default SignOutModal;