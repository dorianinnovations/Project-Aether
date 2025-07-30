/**
 * ShimmerText Component
 * Smooth color-traveling shimmer effect through letters
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
}

export const ShimmerText: React.FC<ShimmerTextProps> = ({
  children,
  style,
  duration = 2000,
  enabled = true,
  delay = 0,
  intensity = 'normal',
  customShimmerColor,
  waveWidth = 'normal'
}) => {
  const { theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Get base and shimmer colors with high contrast
  const getColors = () => {
    // Use the style color if provided, otherwise fallback to clean grey
    const baseColor = style?.color ? String(style.color) : (theme === 'dark' ? '#D4D4D4' : '#6B6B6B');
    
    // Use custom color if provided, otherwise use intensity-based defaults
    let shimmerColor: string;
    if (customShimmerColor) {
      shimmerColor = customShimmerColor;
    } else {
      switch (intensity) {
        case 'subtle':
          shimmerColor = theme === 'dark' 
            ? '#87CEEB'  // Bright sky blue
            : '#1E90FF';  // Dodge blue
          break;
        case 'vibrant':
          shimmerColor = theme === 'dark'
            ? '#00BFFF'  // Deep sky blue - very bright
            : '#0066FF';  // Bright blue
          break;
        default: // normal
          shimmerColor = theme === 'dark'
            ? '#4FC3F7'  // Light blue - clearly visible
            : '#2196F3';  // Material blue
          break;
      }
    }
    
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

    const animate = () => {
      animatedValue.setValue(0);
      Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 3500, // Total cycle duration - slower
          useNativeDriver: false,
        }),
        { iterations: -1 }
      ).start();
    };
    
    // Start animation after initial delay
    const timeoutId = setTimeout(() => animate(), delay);
    
    return () => clearTimeout(timeoutId);
  }, [animatedValue, duration, enabled, delay]);

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
        
        // Map character position to the active wave period (0-0.3 of total cycle)
        const waveStart = charProgress * 0.3;
        const wavePeak = waveStart + peakOffset;
        const waveEnd = waveStart + endOffset;
        
        // Create color interpolation for this specific character
        const animatedColor = animatedValue.interpolate({
          inputRange: [0, waveStart, wavePeak, waveEnd, 0.4, 1],
          outputRange: [
            baseColor,     // Start - static
            baseColor,     // Just before shimmer
            shimmerColor,  // Peak shimmer
            baseColor,     // Just after shimmer
            baseColor,     // Wave complete - static
            baseColor,     // End of cycle - static
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