/**
 * ShineEffect Component
 * Premium dual-layer shine effect for adding subtle elegance to any component
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../contexts/ThemeContext';

interface ShineEffectProps {
  enabled?: boolean;
  intensity?: 'subtle' | 'normal' | 'premium';
  duration?: number;
  delay?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export const ShineEffect: React.FC<ShineEffectProps> = ({ 
  enabled = true,
  intensity = 'normal',
  duration = 2500,
  delay = 0
}) => {
  const { theme } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const secondaryShimmer = useRef(new Animated.Value(0)).current;

  // Get theme-aware shine colors
  const getPrimaryColors = (): readonly [string, string, ...string[]] => {
    const baseOpacity = intensity === 'subtle' ? 0.01 : intensity === 'premium' ? 0.04 : 0.02;
    
    if (theme === 'dark') {
      return [
        'transparent',
        `rgba(255, 255, 255, ${baseOpacity})`,
        `rgba(255, 255, 255, ${baseOpacity * 1.5})`,
        `rgba(255, 255, 255, ${baseOpacity * 2})`,
        `rgba(245, 245, 245, ${baseOpacity * 2.5})`, // Center highlight
        `rgba(255, 255, 255, ${baseOpacity * 2})`,
        `rgba(255, 255, 255, ${baseOpacity * 1.5})`,
        `rgba(255, 255, 255, ${baseOpacity})`,
        'transparent',
      ] as const;
    } else {
      return [
        'transparent',
        `rgba(123, 167, 231, ${baseOpacity})`,
        `rgba(173, 213, 250, ${baseOpacity * 1.5})`,
        `rgba(255, 255, 255, ${baseOpacity * 2})`,
        `rgba(240, 248, 255, ${baseOpacity * 2.5})`, // Center highlight
        `rgba(255, 255, 255, ${baseOpacity * 2})`,
        `rgba(173, 213, 250, ${baseOpacity * 1.5})`,
        `rgba(123, 167, 231, ${baseOpacity})`,
        'transparent',
      ] as const;
    }
  };

  const getSecondaryColors = (): readonly [string, string, ...string[]] => {
    const baseOpacity = intensity === 'subtle' ? 0.005 : intensity === 'premium' ? 0.02 : 0.01;
    
    if (theme === 'dark') {
      return [
        'transparent',
        `rgba(240, 248, 255, ${baseOpacity})`, // Subtle blue tint
        `rgba(255, 255, 255, ${baseOpacity * 1.5})`,
        `rgba(240, 248, 255, ${baseOpacity})`,
        'transparent',
      ] as const;
    } else {
      return [
        'transparent',
        `rgba(123, 167, 231, ${baseOpacity})`,
        `rgba(173, 213, 250, ${baseOpacity * 1.5})`,
        `rgba(123, 167, 231, ${baseOpacity})`,
        'transparent',
      ] as const;
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const startAnimations = () => {
      // Primary shine with premium easing
      const primaryAnimation = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Premium ease-out
            useNativeDriver: true,
          }),
          Animated.delay(1500),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(3000),
        ])
      );

      // Secondary subtle shimmer for depth
      const secondaryAnimation = Animated.loop(
        Animated.sequence([
          Animated.delay(delay + 400), // Offset timing
          Animated.timing(secondaryShimmer, {
            toValue: 1,
            duration: duration * 0.8,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(secondaryShimmer, {
            toValue: 0,
            duration: duration * 0.5,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.delay(2800),
        ])
      );

      primaryAnimation.start();
      secondaryAnimation.start();

      return () => {
        primaryAnimation.stop();
        secondaryAnimation.stop();
      };
    };

    return startAnimations();
  }, [enabled, shimmerAnim, secondaryShimmer, duration, delay, theme, intensity]);

  if (!enabled) return null;

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth * 1.2, screenWidth * 1.2],
  });

  const secondaryTranslateX = secondaryShimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth * 0.8, screenWidth * 0.8],
  });

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0, 0.08, 0.12, 0],
  });

  const secondaryOpacity = secondaryShimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.06, 0],
  });

  return (
    <>
      {/* Primary shine layer */}
      <Animated.View
        style={[
          styles.shimmerContainer,
          {
            transform: [{ translateX: shimmerTranslateX }],
            opacity: shimmerOpacity,
          },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={getPrimaryColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryShimmer}
        />
      </Animated.View>

      {/* Secondary depth layer */}
      <Animated.View
        style={[
          styles.shimmerContainer,
          {
            transform: [{ translateX: secondaryTranslateX }],
            opacity: secondaryOpacity,
          },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={getSecondaryColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.secondaryShimmer}
        />
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  primaryShimmer: {
    width: 140,
    height: '100%',
  },
  secondaryShimmer: {
    width: 200,
    height: '100%',
  },
});

export default ShineEffect;