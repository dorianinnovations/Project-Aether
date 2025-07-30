/**
 * TechyToggleSwitch - Modern animated toggle with techy/human theme
 * Built with react-native-reanimated for smooth 60fps animations
 */

import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface TechyToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  activeColor?: string;
  inactiveColor?: string;
  thumbColor?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  theme?: 'light' | 'dark';
}

const TechyToggleSwitch: React.FC<TechyToggleSwitchProps> = ({
  value,
  onValueChange,
  activeColor = '#00D4AA',
  inactiveColor = '#3A3A3C',
  thumbColor = '#FFFFFF',
  size = 'medium',
  disabled = false,
  theme = 'light',
}) => {
  const animatedValue = useSharedValue(value ? 1 : 0);
  const scaleValue = useSharedValue(1);
  const glowValue = useSharedValue(0);

  // Size configurations
  const sizeConfig = {
    small: { width: 44, height: 24, thumbSize: 18, borderRadius: 12 },
    medium: { width: 52, height: 28, thumbSize: 22, borderRadius: 14 },
    large: { width: 60, height: 32, thumbSize: 26, borderRadius: 16 },
  };

  const config = sizeConfig[size];

  React.useEffect(() => {
    animatedValue.value = withSpring(value ? 1 : 0, {
      damping: 15,
      stiffness: 150,
      mass: 1,
    });
    
    // Glow effect when toggled
    if (value) {
      glowValue.value = withTiming(1, { duration: 300 });
    } else {
      glowValue.value = withTiming(0, { duration: 200 });
    }
  }, [value]);

  const handlePress = () => {
    if (disabled) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Scale animation for press feedback
    scaleValue.value = withTiming(0.95, { duration: 50 }, () => {
      scaleValue.value = withSpring(1, { damping: 15, stiffness: 200 });
    });

    // Trigger callback
    runOnJS(onValueChange)(!value);
  };

  // Track animated style
  const trackAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animatedValue.value,
      [0, 1],
      [inactiveColor, activeColor]
    );

    const borderColor = interpolateColor(
      animatedValue.value,
      [0, 1],
      [theme === 'dark' ? '#2C2C2E' : '#E5E5EA', activeColor]
    );

    return {
      backgroundColor,
      borderColor,
      borderWidth: 2,
      transform: [{ scale: scaleValue.value }],
      shadowOpacity: glowValue.value * 0.4,
      shadowRadius: glowValue.value * 8,
      shadowColor: activeColor,
      elevation: glowValue.value * 4,
    };
  });

  // Thumb animated style
  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const translateX = animatedValue.value * (config.width - config.thumbSize - 6);
    
    const shadowOpacity = interpolateColor(
      animatedValue.value,
      [0, 1],
      [0, 0.3]
    );

    return {
      transform: [
        { translateX },
        { scale: scaleValue.value }
      ],
      shadowOpacity: glowValue.value * 0.2,
      shadowRadius: 4,
      shadowColor: '#000000',
      elevation: 4,
    };
  });

  // Inner glow effect
  const innerGlowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowValue.value * 0.3,
      transform: [{ scale: 1 + glowValue.value * 0.1 }],
    };
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.container,
        disabled && styles.disabled,
      ]}
    >
      <Animated.View
        style={[
          styles.track,
          {
            width: config.width,
            height: config.height,
            borderRadius: config.borderRadius,
          },
          trackAnimatedStyle,
        ]}
      >
        {/* Inner glow effect */}
        <Animated.View
          style={[
            styles.innerGlow,
            {
              borderRadius: config.borderRadius - 2,
            },
            innerGlowStyle,
          ]}
        />
        
        {/* Thumb */}
        <Animated.View
          style={[
            styles.thumb,
            {
              width: config.thumbSize,
              height: config.thumbSize,
              borderRadius: config.thumbSize / 2,
              backgroundColor: thumbColor,
            },
            thumbAnimatedStyle,
          ]}
        >
          {/* Thumb inner highlight */}
          <View style={[
            styles.thumbHighlight,
            {
              width: config.thumbSize * 0.6,
              height: config.thumbSize * 0.6,
              borderRadius: (config.thumbSize * 0.6) / 2,
            }
          ]} />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  innerGlow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  thumb: {
    position: 'absolute',
    left: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
  },
  thumbHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default TechyToggleSwitch;