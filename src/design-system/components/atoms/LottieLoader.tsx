/**
 * Aether Design System - Lottie Loader Component
 * Reusable loading animation using Lottie
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

interface LottieLoaderProps {
  size?: 'small' | 'medium' | 'large' | number;
  color?: string; // Note: This won't affect the Lottie animation colors, but included for API compatibility
  style?: any;
}

export const LottieLoader: React.FC<LottieLoaderProps> = ({
  size = 'medium',
  color, // Kept for compatibility but not used since Lottie colors are baked in
  style,
}) => {
  const getSize = () => {
    if (typeof size === 'number') {
      return size;
    }
    
    switch (size) {
      case 'small':
        return 35;
      case 'medium':
        return 45;
      case 'large':
        return 65;
      default:
        return 45;
    }
  };

  const animationSize = getSize();

  return (
    <View style={[styles.container, style]}>
      <LottieView
        source={require('../../../../assets/NuminaSpinner.json')}
        autoPlay
        loop
        style={{
          width: animationSize,
          height: animationSize,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LottieLoader;