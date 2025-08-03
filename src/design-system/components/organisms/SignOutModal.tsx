/**
 * Aether SignOut Modal Component
 * Reusable modal that can be adapted for various confirmation dialogs
 */

import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
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

  // Cleanup animations
  const resetAnimations = useCallback(() => {
    backgroundOpacity.setValue(0);
    modalScale.setValue(0.8);
    modalOpacity.setValue(0);
    modalTranslateY.setValue(50);
    iconScale.setValue(0);
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
    
    // Much faster background and modal entrance
    Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(modalTranslateY, {
        toValue: 0,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Icon animates with modal for speed
      ...(showIcon ? [Animated.timing(iconScale, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })] : []),
    ]).start(() => {
      setIsAnimating(false);
    });
  }, [isAnimating, backgroundOpacity, modalScale, modalOpacity, modalTranslateY, iconScale, showIcon]);

  // Hide animation
  const hideModal = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Ultra-fast exit animation
    Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.95,
        duration: 60,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(modalTranslateY, {
        toValue: 20,
        duration: 60,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
    ]).start(() => {
      resetAnimations();
    });
  }, [isAnimating, backgroundOpacity, modalScale, modalOpacity, modalTranslateY, resetAnimations]);

  // Effect to handle visibility changes - use useLayoutEffect to avoid insertion warnings
  useLayoutEffect(() => {
    if (visible) {
      // Schedule animation in next tick to avoid insertion effect warning
      const timeoutId = setTimeout(() => {
        showModal();
      }, 0);
      return () => clearTimeout(timeoutId);
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
        toValue: 0.96,
        duration: 30,
        useNativeDriver: true,
      }),
      Animated.timing(cancelButtonScale, {
        toValue: 1,
        duration: 50,
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
        toValue: 0.96,
        duration: 30,
        useNativeDriver: true,
      }),
      Animated.timing(confirmButtonScale, {
        toValue: 1,
        duration: 50,
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
    
    
    return (
      <Animated.View style={[
        styles.iconContainer,
        {
          backgroundColor: iconColor + '15',
          borderColor: iconColor + '30',
          transform: [
            { scale: iconScale }
          ],
        }
      ]}>
        <IconComponent
          name={iconName as any}
          size={20}
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
              backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
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
    width: Math.min(screenWidth - spacing[8], 280),
    borderRadius: 16,
    padding: spacing[4],
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
    borderWidth: 1,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  message: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[4],
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    width: '100%',
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
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