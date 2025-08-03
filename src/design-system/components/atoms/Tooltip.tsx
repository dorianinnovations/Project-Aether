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
  Easing,
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
  const scale = React.useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const currentAnimations = React.useRef<Animated.CompositeAnimation[]>([]);

  const themeColors = getThemeColors(theme);
  const glassmorphicStyle = getGlassmorphicStyle('card', theme);

  // Handle pan gesture for swipe down to dismiss
  const onGestureEvent = Animated.event(
    [{ 
      nativeEvent: { 
        translationY: panY,
        translationX: new Animated.Value(0) // Ignore horizontal movement
      } 
    }],
    { 
      useNativeDriver: true
    }
  );

  // Stop all current animations to prevent conflicts
  const stopAllAnimations = () => {
    currentAnimations.current.forEach(anim => anim.stop());
    currentAnimations.current = [];
  };

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationY, velocityY } = event.nativeEvent;
      
      // Prevent conflicting animations
      if (isAnimating) {
        stopAllAnimations();
      }
      
      // Check if it's a tap (minimal movement) or a swipe
      const isTap = Math.abs(translationY) < 8;
      
      if (isTap) {
        // Tap to change appearance - make less transparent and narrower, then restore
        setIsPressed(true);
        setIsAnimating(true);
        
        const tapInAnimation = Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 120,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.82,
            duration: 120,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]);
        
        currentAnimations.current.push(tapInAnimation);
        tapInAnimation.start(() => {
          // Immediately restore to normal state after tap feedback
          const tapOutAnimation = Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0.9,
              duration: 150,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: 150,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]);
          
          currentAnimations.current.push(tapOutAnimation);
          tapOutAnimation.start(() => {
            setIsPressed(false);
            setIsAnimating(false);
          });
        });
        
      } else {
        // Reset pressed state immediately for swipes
        setIsPressed(false);
        setIsAnimating(true);
        
        // Calculate dismiss probability based on distance and velocity
        const dismissThreshold = 25;
        const velocityThreshold = 400;
        
        // Progressive threshold - easier to dismiss with more distance or velocity
        const distanceRatio = Math.max(0, translationY) / dismissThreshold;
        const velocityRatio = Math.max(0, velocityY) / velocityThreshold;
        const dismissScore = distanceRatio + (velocityRatio * 0.7);
        
        if (dismissScore > 0.8) {
          // Smooth dismiss with natural easing
          const finalY = Math.min(15, Math.max(8, translationY * 0.3));
          
          const dismissAnimation = Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0,
              duration: 280,
              easing: Easing.out(Easing.exp),
              useNativeDriver: true,
            }),
            Animated.timing(panY, {
              toValue: finalY,
              duration: 280,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]);
          
          currentAnimations.current.push(dismissAnimation);
          dismissAnimation.start(() => {
            // Reset all values for next use
            panY.setValue(0);
            translateY.setValue(-10);
            scale.setValue(1);
            opacity.setValue(0);
            setIsPressed(false);
            setIsAnimating(false);
            onHide?.();
          });
        } else {
          // Natural spring back with improved physics
          const springAnimation = Animated.spring(panY, {
            toValue: 0,
            tension: 180,
            friction: 12,
            velocity: -velocityY * 0.1,
            useNativeDriver: true,
          });
          
          currentAnimations.current.push(springAnimation);
          springAnimation.start(() => {
            setIsAnimating(false);
          });
        }
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
    // Stop any ongoing animations when visibility changes
    stopAllAnimations();
    
    if (visible) {
      // Use setTimeout to avoid state updates during render
      setTimeout(() => {
        setIsPressed(false);
        setIsAnimating(true);
      }, 0);
      
      // Reset pan position when showing
      panY.setValue(0);
      
      const showAnimation = Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 200,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]);
      
      currentAnimations.current.push(showAnimation);
      showAnimation.start(() => {
        setIsAnimating(false);
      });
    } else {
      // Use setTimeout to avoid state updates during render
      setTimeout(() => {
        setIsAnimating(true);
      }, 0);
      
      const hideAnimation = Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -8,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
      
      currentAnimations.current.push(hideAnimation);
      hideAnimation.start(() => {
        // Reset all values when hidden to ensure clean state
        panY.setValue(0);
        scale.setValue(1); // Force scale back to 1
        setIsPressed(false);
        setIsAnimating(false);
      });
    }
  }, [visible]);

  // Cleanup animations on unmount
  React.useEffect(() => {
    return () => {
      stopAllAnimations();
    };
  }, []);

  if (!visible) return null;

  const TooltipContent = (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [
            { translateY },
            { translateY: panY },
            { scaleX: scale }
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
      activeOffsetY={3}
      failOffsetX={[-25, 25]}
      shouldCancelWhenOutside={false}
      minPointers={1}
      maxPointers={1}
      avgTouches={true}
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
    paddingHorizontal: spacing[6],
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
  }

});

export default Tooltip;