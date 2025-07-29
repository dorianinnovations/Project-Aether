/**
 * Aether Design System - Tooltip Component
 * Simple tooltip for showing temporary feedback messages
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';

// Design System
import { designTokens, getThemeColors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';

interface TooltipProps {
  /** Whether the tooltip should be visible */
  visible: boolean;
  /** Text to display in the tooltip */
  text: string;
  /** Theme for styling */
  theme?: 'light' | 'dark';
  /** Custom style override */
  style?: ViewStyle;
  /** Duration to auto-hide (0 = no auto-hide) */
  autoHideDuration?: number;
  /** Callback when tooltip hides */
  onHide?: () => void;
}

const Tooltip: React.FC<TooltipProps> = ({
  visible,
  text,
  theme = 'light',
  style,
  autoHideDuration = 2000,
  onHide,
}) => {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-10)).current;

  const themeColors = getThemeColors(theme);
  const glassmorphicStyle = getGlassmorphicStyle('card', theme);

  // Auto-hide timer
  React.useEffect(() => {
    if (visible && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onHide?.();
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [visible, autoHideDuration, onHide]);

  // Animate visibility
  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -10,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
        style,
      ]}
    >
      <View
        style={[
          styles.tooltip,
          glassmorphicStyle,
          {
            backgroundColor: themeColors.surface,
            borderColor: themeColors.borders.default,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              color: themeColors.text,
            },
          ]}
        >
          {text}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  tooltip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  text: {
    ...typography.textStyles.labelSmall,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default Tooltip;