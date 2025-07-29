/**
 * Aether Design System - Button Component
 * Sophisticated neumorphic button with haptic feedback
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { designTokens, getThemeColors } from '../../tokens/colors';
import LottieLoader from './LottieLoader';
import { typography } from '../../tokens/typography';
import { spacing, borderRadius } from '../../tokens/spacing';
import { getNeumorphicStyle } from '../../tokens/shadows';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  state?: 'default' | 'pressed' | 'disabled' | 'loading';
  hasGlow?: boolean;
  theme?: 'light' | 'dark';
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  state = 'default',
  hasGlow = false,
  theme = 'light',
  children,
  onPress,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const animatedValue = React.useRef(new Animated.Value(1)).current;
  const animatedScale = React.useRef(new Animated.Value(1)).current;
  const glowAnimated = React.useRef(new Animated.Value(0)).current;

  const themeColors = getThemeColors(theme);

  // Haptic feedback and animation on press
  const handlePressIn = () => {
    if (state === 'disabled' || state === 'loading') return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.parallel([
      Animated.timing(animatedScale, {
        toValue: 0.92,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0.8,
        duration: 40,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (state === 'disabled' || state === 'loading') return;
    
    Animated.parallel([
      Animated.timing(animatedScale, {
        toValue: 1.05,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 60,
        useNativeDriver: false,
      }),
    ]).start(() => {
      Animated.timing(animatedScale, {
        toValue: 1,
        duration: 90,
        useNativeDriver: true,
      }).start();
    });
  };

  // Glow animation effect
  React.useEffect(() => {
    if (hasGlow) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnimated, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnimated, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [hasGlow, glowAnimated]);

  const getButtonStyles = () => {
    const baseStyle = getNeumorphicStyle(
      state === 'pressed' ? 'inset' : 'elevated',
      theme
    );

    const variantStyles = {
      primary: {
        backgroundColor: variant === 'primary' 
          ? (theme === 'light' ? designTokens.brand.primary : designTokens.brand.primaryDark)
          : baseStyle.backgroundColor,
      },
      secondary: {
        backgroundColor: baseStyle.backgroundColor,
        borderWidth: 1.5,
        borderColor: themeColors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
      },
    };

    const sizeStyles = {
      sm: {
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderRadius: borderRadius.md,
        minHeight: 36,
      },
      md: {
        paddingHorizontal: spacing[5],
        paddingVertical: spacing[3],
        borderRadius: borderRadius.lg,
        minHeight: 44,
      },
      lg: {
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[4],
        borderRadius: borderRadius.xl,
        minHeight: 52,
      },
    };

    return [
      baseStyle,
      variantStyles[variant],
      sizeStyles[size],
      fullWidth && { alignSelf: 'stretch' as const },
      state === 'disabled' && {
        opacity: 0.6,
      },
      style,
    ].filter(Boolean);
  };

  const getTextStyles = () => {
    const sizeStyles = {
      sm: typography.textStyles.labelSmall,
      md: typography.textStyles.labelMedium,
      lg: typography.textStyles.labelLarge,
    };

    const colorStyles = {
      primary: {
        color: variant === 'primary' 
          ? designTokens.text.primaryDark
          : themeColors.primary,
      },
      secondary: {
        color: themeColors.primary,
      },
      ghost: {
        color: themeColors.primary,
      },
    };

    return [
      sizeStyles[size],
      colorStyles[variant],
      textStyle,
    ];
  };

  const glowStyle = hasGlow ? {
    shadowColor: designTokens.brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowAnimated,
    shadowRadius: 12,
  } : {};

  return (
    <Animated.View
      style={[
        { transform: [{ scale: animatedScale }] },
        glowStyle,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={state === 'disabled' || state === 'loading'}
        activeOpacity={1}
        style={[
          styles.button,
          getButtonStyles(),
        ]}
      >
        {state === 'loading' ? (
          <LottieLoader
            size="small"
            color={variant === 'primary' ? designTokens.text.primaryDark : themeColors.primary}
          />
        ) : (
          <Text style={getTextStyles()}>
            {children}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

export default Button;