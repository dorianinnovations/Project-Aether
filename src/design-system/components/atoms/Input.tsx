/**
 * Aether Design System - Input Component
 * Elegant neumorphic input with focus animations
 */

import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { designTokens, getThemeColors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing, borderRadius } from '../../tokens/spacing';
import { getNeumorphicStyle } from '../../tokens/shadows';

interface InputProps extends TextInputProps {
  variant?: 'default' | 'focused' | 'error';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  error?: string;
  theme?: 'light' | 'dark';
  hasAnimation?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

const Input: React.FC<InputProps> = ({
  variant = 'default',
  size = 'md',
  label,
  error,
  theme = 'light',
  hasAnimation = true,
  containerStyle,
  inputStyle,
  labelStyle,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const scaleAnimated = React.useRef(new Animated.Value(1)).current;
  const labelAnimated = React.useRef(new Animated.Value(0)).current;

  const themeColors = getThemeColors(theme);

  // Focus animations
  const handleFocus = (e: any) => {
    setIsFocused(true);
    
    if (hasAnimation) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(scaleAnimated, {
          toValue: 1.02,
          duration: 200,
          useNativeDriver: true,
        }),
        ...(label ? [Animated.timing(labelAnimated, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })] : []),
      ]).start();
    }
    
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    
    if (hasAnimation) {
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(scaleAnimated, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        ...(label && !textInputProps.value ? [Animated.timing(labelAnimated, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })] : []),
      ]).start();
    }
    
    onBlur?.(e);
  };

  const getContainerStyles = () => {
    const currentVariant = error ? 'error' : (isFocused ? 'focused' : variant);
    
    const baseStyle = getNeumorphicStyle(
      currentVariant === 'focused' ? 'subtle' : 'inset',
      theme
    );

    const sizeStyles = {
      sm: {
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderRadius: borderRadius.md,
        minHeight: 36,
      },
      md: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        borderRadius: borderRadius.lg,
        minHeight: 44,
      },
      lg: {
        paddingHorizontal: spacing[5],
        paddingVertical: spacing[4],
        borderRadius: borderRadius.xl,
        minHeight: 52,
      },
    };

    const variantStyles = {
      default: {},
      focused: {
        borderWidth: 1.5,
        borderColor: designTokens.brand.primary,
      },
      error: {
        borderWidth: 1.5,
        borderColor: designTokens.semantic.error,
      },
    };

    return [
      baseStyle,
      sizeStyles[size],
      variantStyles[currentVariant],
      containerStyle,
    ];
  };

  const getInputTextStyles = () => {
    const sizeStyles = {
      sm: typography.textStyles.bodySmall,
      md: typography.textStyles.bodyMedium,
      lg: typography.textStyles.bodyLarge,
    };

    return [
      sizeStyles[size],
      {
        color: themeColors.text,
        flex: 1,
        paddingVertical: 0, // Remove default padding
      },
      inputStyle,
    ];
  };

  const getLabelStyles = () => {
    const currentVariant = error ? 'error' : (isFocused ? 'focused' : variant);
    
    return [
      typography.textStyles.labelSmall,
      {
        color: currentVariant === 'error' 
          ? designTokens.semantic.error 
          : (currentVariant === 'focused' 
            ? designTokens.brand.primary 
            : themeColors.textSecondary),
        marginBottom: spacing[1],
        transform: [{
          translateY: labelAnimated.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -2],
          }),
        }],
      },
      labelStyle,
    ];
  };

  const getErrorStyles = () => [
    typography.textStyles.caption,
    {
      color: designTokens.semantic.error,
      marginTop: spacing[1],
    },
  ];

  const placeholderTextColor = theme === 'light' 
    ? designTokens.text.placeholder 
    : designTokens.text.placeholderDark;

  return (
    <View style={styles.wrapper}>
      {label && (
        <Animated.Text style={getLabelStyles()}>
          {label}
        </Animated.Text>
      )}
      
      <Animated.View
        style={[
          styles.container,
          getContainerStyles(),
          { transform: [{ scale: scaleAnimated }] },
        ]}
      >
        <TextInput
          {...textInputProps}
          style={getInputTextStyles()}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={placeholderTextColor}
          selectionColor={designTokens.brand.primary}
        />
      </Animated.View>
      
      {error && (
        <Animated.Text 
          style={[
            getErrorStyles(),
            {
              opacity: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1],
              }),
            },
          ]}
        >
          {error}
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
});

export default Input;