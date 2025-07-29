/**
 * Aether Design System - Scroll to Bottom Button
 * Floating chevron button for instant scroll to bottom functionality
 */

import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

// Design System
import { designTokens, getThemeColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import Icon from './Icon';

interface ScrollToBottomButtonProps {
  /** Whether the button should be visible */
  visible: boolean;
  /** Callback when button is pressed */
  onPress: () => void;
  /** Theme for styling */
  theme?: 'light' | 'dark';
  /** Custom style override */
  style?: ViewStyle;
}

const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
  visible,
  onPress,
  theme = 'light',
  style,
}) => {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(0.8)).current;

  const themeColors = getThemeColors(theme);
  const glassmorphicStyle = getGlassmorphicStyle('card', theme);

  // Animate visibility
  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 200,
          friction: 8,
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
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ scale }],
        },
        style,
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          glassmorphicStyle,
          {
            backgroundColor: themeColors.surface,
            borderColor: themeColors.borders.default,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Icon
          name="chevron-down"
          size="sm"
          color="primary"
          theme={theme}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120, // Above chat input
    alignSelf: 'center',
    zIndex: 100,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
});

export default ScrollToBottomButton;