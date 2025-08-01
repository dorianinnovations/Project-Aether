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
  TextStyle,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

// Design System
import { designTokens, getThemeColors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';

interface TooltipProps {
  /** Whether the tooltip should be visible */
  visible: boolean;
  /** Text to display in the tooltip */
  text?: string;
  /** Left aligned text */
  leftText?: string;
  /** Right aligned text */
  rightText?: string;
  /** Theme for styling */
  theme?: 'light' | 'dark';
  /** Custom style override */
  style?: ViewStyle;
  /** Custom tooltip container style */
  tooltipStyle?: ViewStyle;
  /** Custom text style */
  textStyle?: TextStyle;
  /** Duration to auto-hide (0 = no auto-hide) */
  autoHideDuration?: number;
  /** Callback when tooltip hides */
  onHide?: () => void;
  /** Enable swipe down to dismiss */
  swipeToDismiss?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  visible,
  text,
  leftText,
  rightText,
  theme = 'light',
  style,
  tooltipStyle,
  textStyle,
  autoHideDuration = 2000,
  onHide,
  swipeToDismiss = true,
}) => {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-10)).current;
  const panY = React.useRef(new Animated.Value(0)).current;

  const themeColors = getThemeColors(theme);
  const glassmorphicStyle = getGlassmorphicStyle('card', theme);

  // Handle pan gesture for swipe down to dismiss
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: panY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationY, velocityY } = event.nativeEvent;
      
      // Dismiss if swiped down enough (threshold: 50px) or with enough velocity
      if (translationY > 50 || velocityY > 800) {
        // Fade out and dismiss
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          panY.setValue(0);
          opacity.setValue(1);
          onHide?.();
        });
      } else {
        // Spring back to original position
        Animated.spring(panY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    }
  };

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

  const TooltipContent = (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [
            { translateY },
            { translateY: panY }
          ],
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
          tooltipStyle,
        ]}
      >
        {(leftText || rightText) ? (
          <View style={styles.splitTextContainer}>
            {leftText && (
              <Text
                style={[
                  styles.text,
                  styles.leftText,
                  {
                    color: themeColors.text,
                  },
                  textStyle,
                ]}
              >
                {leftText}
              </Text>
            )}
            {rightText && (
              <Text
                style={[
                  styles.text,
                  styles.rightText,
                  {
                    color: themeColors.text,
                  },
                  textStyle,
                ]}
              >
                {rightText}
              </Text>
            )}
          </View>
        ) : (
          <Text
            style={[
              styles.text,
              {
                color: themeColors.text,
              },
              textStyle,
            ]}
          >
            {text}
          </Text>
        )}
      </View>
    </Animated.View>
  );

  return swipeToDismiss ? (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      {TooltipContent}
    </PanGestureHandler>
  ) : (
    TooltipContent
  );
};

const styles = StyleSheet.create({
  container: {
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
  splitTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  leftText: {
    textAlign: 'left',
    flex: 0,
  },
  rightText: {
    textAlign: 'right',
    flex: 0,
  },
});

export default Tooltip;