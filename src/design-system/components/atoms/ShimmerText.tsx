/**
 * ShimmerText Component
 * Enhanced shimmer text effect with theme awareness and customizable properties
 */

import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useTheme } from '../../../contexts/ThemeContext';
import { designTokens } from '../../tokens/colors';

interface ShimmerTextProps {
  children: string;
  style?: TextStyle;
  duration?: number;
  shimmerColors?: string[];
  enabled?: boolean;
  delay?: number;
  intensity?: 'subtle' | 'normal' | 'vibrant';
}

export const ShimmerText: React.FC<ShimmerTextProps> = ({
  children,
  style,
  duration = 2500,
  shimmerColors,
  enabled = true,
  delay = 0,
  intensity = 'normal'
}) => {
  const { theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Get theme-aware shimmer colors
  const getShimmerColors = (): string[] => {
    if (shimmerColors) return shimmerColors;
    
    switch (intensity) {
      case 'subtle':
        return theme === 'dark' 
          ? ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.1)']
          : ['rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.15)', 'rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.05)'];
      
      case 'vibrant':
        return theme === 'dark'
          ? [designTokens.brand.accent, '#4ECDC4', '#C77DFF', '#FF8FA3', designTokens.brand.accent]
          : [designTokens.brand.primary, designTokens.pastels.cyan, designTokens.pastels.purple, designTokens.pastels.pink, designTokens.brand.primary];
      
      default: // normal
        return theme === 'dark'
          ? ['rgba(123, 167, 231, 0.3)', 'rgba(173, 213, 250, 0.5)', 'rgba(255, 255, 255, 0.8)', 'rgba(173, 213, 250, 0.5)', 'rgba(123, 167, 231, 0.3)']
          : ['rgba(123, 167, 231, 0.4)', 'rgba(173, 213, 250, 0.6)', 'rgba(255, 255, 255, 0.9)', 'rgba(173, 213, 250, 0.6)', 'rgba(123, 167, 231, 0.4)'];
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const animate = () => {
      animatedValue.setValue(0);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => animate(), delay + 200);
      });
    };
    
    // Start animation after initial delay
    const timeoutId = setTimeout(() => animate(), delay);
    
    return () => clearTimeout(timeoutId);
  }, [animatedValue, duration, enabled, delay]);

  if (!enabled) {
    return <Text style={style}>{children}</Text>;
  }

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-400, 400],
  });

  const shimmerOpacity = animatedValue.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0.3, 1, 1, 0.3],
  });

  return (
    <View style={{ overflow: 'visible' }}>
      <MaskedView
        style={{ 
          flexDirection: 'row',
          height: style?.fontSize ? Number(style.fontSize) + 10 : 30,
          width: '100%',
          minWidth: 300, // Ensure enough width for longer text
        }}
        maskElement={
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={[style, { backgroundColor: 'transparent', textAlign: 'center' }]}>
              {children}
            </Text>
          </View>
        }
      >
        <Animated.View
          style={{
            flex: 1,
            flexDirection: 'row',
            transform: [{ translateX }],
            opacity: shimmerOpacity,
          }}
        >
          <LinearGradient
            colors={getShimmerColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
              width: 500, // Increased width for longer text
              minWidth: 500,
            }}
            locations={[0, 0.25, 0.5, 0.75, 1]}
          />
        </Animated.View>
      </MaskedView>
    </View>
  );
};

export default ShimmerText;