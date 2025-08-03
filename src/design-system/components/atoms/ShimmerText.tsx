/**
 * ShimmerText Component
 * White band with dimmer static effect
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Text, TextStyle } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';

interface ShimmerTextProps {
  children: string;
  style?: TextStyle;
  duration?: number;
  enabled?: boolean;
  delay?: number;
  intensity?: 'subtle' | 'normal' | 'vibrant';
  customShimmerColor?: string;
  waveWidth?: 'narrow' | 'normal' | 'wide';
  colorMode?: 'static' | 'pastel-cycle';
  animationMode?: 'loop' | 'greeting-sequence';
}

export const ShimmerText: React.FC<ShimmerTextProps> = ({
  children,
  style,
  duration = 2000,
  enabled = true,
  delay = 0,
  intensity = 'normal',
  customShimmerColor,
  waveWidth = 'normal',
  colorMode = 'static',
  animationMode = 'loop'
}) => {
  const { theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Get base and shimmer colors for white band effect
  const getColors = () => {
    // Dimmer base color
    const baseColor = theme === 'dark' ? '#2a2a2a' : '#8a8a8a';
    
    // White band color
    const shimmerColor = '#ffffff';
    
    return { baseColor, shimmerColor };
  };

  // Get wave width settings
  const getWaveSettings = () => {
    switch (waveWidth) {
      case 'narrow':
        return { peakOffset: 0.02, endOffset: 0.04 };
      case 'wide':
        return { peakOffset: 0.06, endOffset: 0.12 };
      default: // normal
        return { peakOffset: 0.04, endOffset: 0.08 };
    }
  };

  useEffect(() => {
    if (!enabled) return;

    let animationRef: any = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const animate = () => {
      if (animationMode === 'greeting-sequence') {
        // Custom greeting sequence: 2.6s forward → 0.5s pause → 0.5s reverse → 7s pause
        const runGreetingSequence = () => {
          animatedValue.setValue(0);
          
          // Forward animation (2.6s) - go to 1.2 so shimmer fully exits text
          Animated.timing(animatedValue, {
            toValue: 1.2,
            duration: 2600,
            useNativeDriver: false,
          }).start(() => {
            // 0.5s pause, then reverse
            setTimeout(() => {
              // Reverse animation (0.5s)
              Animated.timing(animatedValue, {
                toValue: 0,
                duration: 500,
                useNativeDriver: false,
              }).start(() => {
                // 7s pause before repeating
                setTimeout(() => {
                  runGreetingSequence();
                }, 7000);
              });
            }, 500);
          });
        };
        
        runGreetingSequence();
      } else {
        // Default loop animation
        animatedValue.setValue(0);
        animationRef = Animated.loop(
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 4000, // Slower animation for more subtle effect
            useNativeDriver: false,
          }),
          { iterations: -1 }
        );
        animationRef.start();
      }
    };
    
    // Start animation after initial delay
    timeoutId = setTimeout(() => animate(), delay);
    
    // Cleanup function to stop animation and clear timeout
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (animationRef) animationRef.stop();
    };
  }, [animatedValue, duration, enabled, delay, animationMode]);

  if (!enabled) {
    return <Text style={style}>{children}</Text>;
  }

  const { baseColor, shimmerColor } = getColors();
  const { peakOffset, endOffset } = getWaveSettings();
  
  // Split text into characters
  const characters = children.split('');

  return (
    <Text style={style}>
      {characters.map((char, index) => {
        // Calculate when this character should shimmer based on its position
        const charProgress = index / Math.max(characters.length - 1, 1);
        
        // Create a white band that moves across the text
        const bandStart = charProgress * 0.4; // Band starts earlier
        const bandPeak = bandStart + peakOffset;
        const bandEnd = bandStart + endOffset;
        
        // Ensure monotonic increasing inputRange
        const bandEndClamped = Math.min(bandEnd, 0.49);
        const staticStart = Math.max(bandEndClamped + 0.01, 0.5);
        
        // Create color interpolation for this specific character
        const animatedColor = animatedValue.interpolate({
          inputRange: [0, bandStart, bandPeak, bandEndClamped, staticStart, 1],
          outputRange: [
            baseColor,        // Start - dimmer static
            baseColor,        // Just before white band
            shimmerColor,     // Peak - white band
            baseColor,        // Just after white band
            baseColor,        // Band complete - dimmer static
            baseColor,        // End of cycle - dimmer static
          ],
          extrapolate: 'clamp',
        });

        return (
          <Animated.Text
            key={index}
            style={[
              style,
              {
                color: animatedColor,
              },
            ]}
          >
            {char}
          </Animated.Text>
        );
      })}
    </Text>
  );
};

export default ShimmerText;