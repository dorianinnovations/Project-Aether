/**
 * RainbowShimmerText Component
 * Rainbow bands with dimmer static effect
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Text, TextStyle } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';

interface RainbowShimmerTextProps {
  children: string;
  style?: TextStyle;
  duration?: number;
  enabled?: boolean;
  delay?: number;
  intensity?: 'subtle' | 'normal' | 'vibrant';
  customShimmerColor?: string;
  waveWidth?: 'narrow' | 'normal' | 'wide';
  colorMode?: 'static' | 'rainbow-cycle';
}

export const RainbowShimmerText: React.FC<RainbowShimmerTextProps> = ({
  children,
  style,
  duration = 4000,
  enabled = true,
  delay = 0,
  intensity = 'vibrant',
  customShimmerColor,
  waveWidth = 'wide',
  colorMode = 'rainbow-cycle'
}) => {
  const { theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Pastel rainbow color palette
  const rainbowColors = [
    '#FF5E6C', // Bright Red
    '#FFB347', // Bright Orange
    '#FFF700', // Bright Yellow
    '#4CFF4C', // Bright Green
    '#4CB3FF', // Bright Blue
    '#7C4CFF', // Bright Indigo
    '#E04CFF', // Bright Violet
  ];

  // Get base and shimmer colors for rainbow band effect
  const getColors = () => {
    // Dimmer base color
    const baseColor = theme === 'dark' ? '#e0e0e0' : '#8a8a8a';
    
    // Rainbow colors will be applied per character based on position
    const shimmerColor = '#ffffff'; // Default, will be overridden
    
    return { baseColor, shimmerColor };
  };

  // Get wave width settings
  const getWaveSettings = () => {
    switch (waveWidth) {
      case 'narrow':
        return { peakOffset: 0.04, endOffset: 0.08 };
      case 'wide':
        return { peakOffset: 0.12, endOffset: 0.24 };
      default: // normal
        return { peakOffset: 0.08, endOffset: 0.16 };
    }
  };

  // Get rainbow color for a specific character position
  const getRainbowColor = (index: number, totalChars: number) => {
    const colorIndex = Math.floor((index / totalChars) * rainbowColors.length);
    return rainbowColors[colorIndex % rainbowColors.length];
  };

  useEffect(() => {
    if (!enabled) return;

    let animationRef: any = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const animate = () => {
      animatedValue.setValue(0);
      animationRef = Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration, // Use the duration prop for customizable speed
          useNativeDriver: false,
        }),
        { iterations: -1 }
      );
      animationRef.start();
    };
    
    // Start animation after initial delay
    timeoutId = setTimeout(() => animate(), delay);
    
    // Cleanup function to stop animation and clear timeout
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (animationRef) animationRef.stop();
    };
  }, [animatedValue, duration, enabled, delay]);

  if (!enabled) {
    return <Text style={style}>{children}</Text>;
  }

  const { baseColor } = getColors();
  const { peakOffset, endOffset } = getWaveSettings();
  
  // Split text into characters
  const characters = children.split('');

  return (
    <Text style={style}>
      {characters.map((char, index) => {
        // Calculate when this character should shimmer based on its position
        const charProgress = index / Math.max(characters.length - 1, 1);
        
        // Create a rainbow band that moves across the text
        const bandStart = charProgress * 0.3; // Band starts earlier and covers more text
        const bandPeak = bandStart + peakOffset;
        const bandEnd = bandStart + endOffset;
        
        // Ensure monotonic increasing inputRange
        const bandEndClamped = Math.min(bandEnd, 0.59);
        const staticStart = Math.max(bandEndClamped + 0.01, 0.6);
        
        // Get the rainbow color for this character
        const rainbowColor = getRainbowColor(index, characters.length);
        
        // Create color interpolation for this specific character
        const animatedColor = animatedValue.interpolate({
          inputRange: [0, bandStart, bandPeak, bandEndClamped, staticStart, 1],
          outputRange: [
            baseColor,        // Start - dimmer static
            baseColor,        // Just before rainbow band
            rainbowColor,     // Peak - rainbow color
            baseColor,        // Just after rainbow band
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

export default RainbowShimmerText; 