/**
 * Aether Design System - Dismissible Banner Component
 * Reusable component for showing temporary content that can be dismissed
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { designTokens, getThemeColors, getComponentBorder } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing, borderRadius } from '../../tokens/spacing';
import { getNeumorphicStyle } from '../../tokens/shadows';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';

export interface DismissibleBannerProps {
  /** Content to display */
  title?: string;
  content?: string | React.ReactNode;
  
  /** Visibility control */
  visible: boolean;
  onDismiss?: () => void;
  
  /** Auto-dismiss configuration */
  autoDismiss?: boolean;
  autoDismissDelay?: number; // in milliseconds
  
  /** Styling */
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error';
  style?: 'glassmorphic' | 'neumorphic' | 'minimal';
  theme?: 'light' | 'dark';
  
  /** Layout */
  position?: 'top' | 'bottom' | 'inline';
  showCloseButton?: boolean;
  
  /** Animation */
  animationType?: 'fade' | 'slide' | 'scale';
  animationDuration?: number;
  
  /** Events */
  onPress?: () => void;
  onShow?: () => void;
  onHide?: () => void;
  
  /** Custom styling */
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
}

const DismissibleBanner: React.FC<DismissibleBannerProps> = ({
  title,
  content,
  visible,
  onDismiss,
  autoDismiss = false,
  autoDismissDelay = 5000,
  variant = 'default',
  style = 'glassmorphic',
  theme = 'light',
  position = 'inline',
  showCloseButton = true,
  animationType = 'slide',
  animationDuration = 300,
  onPress,
  onShow,
  onHide,
  containerStyle,
  textStyle,
}) => {
  const [isVisible, setIsVisible] = useState(visible);
  const animatedValue = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const autoDismissTimer = useRef<NodeJS.Timeout | null>(null);

  const themeColors = getThemeColors(theme);

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      onShow?.();
      
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: animationDuration,
        useNativeDriver: animationType !== 'slide',
      }).start();

      // Setup auto-dismiss
      if (autoDismiss) {
        autoDismissTimer.current = setTimeout(async () => {
          await handleDismiss();
        }, autoDismissDelay);
      }
    } else {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: animationDuration,
        useNativeDriver: animationType !== 'slide',
      }).start(() => {
        setIsVisible(false);
        onHide?.();
      });
    }

    return () => {
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
    };
  }, [visible]);

  const handleDismiss = async () => {
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
    }
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss?.();
  };

  const handlePress = async () => {
    if (onPress) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const getVariantColors = () => {
    const variants = {
      default: {
        background: themeColors.surface,
        text: themeColors.text,
        border: designTokens.brand.primary,
      },
      info: {
        background: designTokens.semantic.info + '20',
        text: themeColors.text,
        border: designTokens.semantic.info,
      },
      success: {
        background: designTokens.semantic.success + '20',
        text: themeColors.text,
        border: designTokens.semantic.success,
      },
      warning: {
        background: designTokens.semantic.warning + '20',
        text: themeColors.text,
        border: designTokens.semantic.warning,
      },
      error: {
        background: designTokens.semantic.error + '20',
        text: themeColors.text,
        border: designTokens.semantic.error,
      },
    };
    
    return variants[variant];
  };

  const getContainerStyle = () => {
    const variantColors = getVariantColors();
    const borderStyle = getComponentBorder(theme);
    let baseStyle: ViewStyle = {};

    // Apply style variant
    switch (style) {
      case 'glassmorphic':
        baseStyle = getGlassmorphicStyle('card', theme);
        break;
      case 'neumorphic':
        baseStyle = getNeumorphicStyle('elevated', theme);
        break;
      case 'minimal':
        baseStyle = {
          backgroundColor: variantColors.background,
          ...borderStyle,
        };
        break;
    }

    // Apply position-specific styles
    const positionStyle: ViewStyle = {};
    if (position === 'top') {
      positionStyle.position = 'absolute';
      positionStyle.top = 0;
      positionStyle.left = 0;
      positionStyle.right = 0;
      positionStyle.zIndex = 1000;
    } else if (position === 'bottom') {
      positionStyle.position = 'absolute';
      positionStyle.bottom = 0;
      positionStyle.left = 0;
      positionStyle.right = 0;
      positionStyle.zIndex = 1000;
    }

    return [
      styles.container,
      baseStyle,
      borderStyle,
      positionStyle,
      {
        borderRadius: borderRadius.lg,
        padding: spacing[3],
        margin: spacing[2],
      },
      containerStyle,
    ];
  };

  const getAnimatedStyle = () => {
    switch (animationType) {
      case 'fade':
        return {
          opacity: animatedValue,
        };
      case 'scale':
        return {
          opacity: animatedValue,
          transform: [{
            scale: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            }),
          }],
        };
      case 'slide':
      default: {
        const slideDirection = position === 'top' ? -50 : position === 'bottom' ? 50 : 20;
        return {
          opacity: animatedValue,
          transform: [{
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [slideDirection, 0],
            }),
          }],
        };
      }
    }
  };

  const renderContent = () => {
    const variantColors = getVariantColors();
    
    return (
      <View style={styles.contentContainer}>
        {title && (
          <Text style={[
            styles.title,
            { color: variantColors.text },
            textStyle,
          ]}>
            {title}
          </Text>
        )}
        
        {typeof content === 'string' ? (
          <Text style={[
            styles.content,
            { color: variantColors.text },
            textStyle,
          ]}>
            {content}
          </Text>
        ) : (
          content
        )}
      </View>
    );
  };

  const renderCloseButton = () => {
    if (!showCloseButton) return null;
    
    return (
      <Pressable
        style={styles.closeButton}
        onPress={handleDismiss}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.closeIcon, { color: themeColors.textSecondary }]}>
          ✕
        </Text>
      </Pressable>
    );
  };

  if (!isVisible) return null;

  const ContainerComponent = onPress ? Pressable : View;

  return (
    <Animated.View style={[getContainerStyle(), getAnimatedStyle()]}>
      <ContainerComponent
        style={styles.innerContainer}
        onPress={onPress ? handlePress : undefined}
      >
        {renderContent()}
        {renderCloseButton()}
      </ContainerComponent>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  innerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  contentContainer: {
    flex: 1,
    gap: spacing[1],
  },
  
  title: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
  },
  
  content: {
    ...typography.textStyles.bodySmall,
  },
  
  closeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[2],
  },
  
  closeIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default DismissibleBanner;