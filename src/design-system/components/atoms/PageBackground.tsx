/**
 * Numina Design System - Page Background Component
 * The dreamy baby blue gradient standard from numina-mobile ✨
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { designTokens, getThemeColors } from '../../tokens/colors';

interface PageBackgroundProps {
  theme?: 'light' | 'dark';
  children: React.ReactNode;
  variant?: 'default' | 'auth' | 'hero' | 'profile' | 'chat' | 'connections';
  style?: ViewStyle;
}

export const PageBackground: React.FC<PageBackgroundProps> = ({
  theme = 'light',
  children,
  variant = 'default',
  style,
}) => {
  const themeColors = getThemeColors(theme);

  // The dreamy baby blue gradient colors - brighter (closer to white)! 💙✨
  const dreamyGradientColors = ['#ffffff', '#f2f8ff', '#e2f0ff', '#eaf4ff', '#f4faff'];
  
  // Consistent dark grey background
  const darkGrey = '#0F0F0F';

  const getGradientColors = (): string[] => {
    switch (variant) {
      case 'hero':
        return theme === 'light' 
          ? ['#C6D2FF', '#A4F4CF', '#FEE685'] // Soft Blue-Green-Yellow from numina
          : [darkGrey, '#1A1A1A', darkGrey];
      
      case 'auth':
        return theme === 'light'
          ? dreamyGradientColors
          : [darkGrey, '#1A1A1A', darkGrey];
      
      case 'profile':
        return theme === 'light'
          ? ['#f5f3ff', '#faf9ff', '#f5f3ff'] // Cosmic light
          : [darkGrey, '#1A1A1A', darkGrey]; // Consistent dark
      
      case 'chat':
        return theme === 'light'
          ? dreamyGradientColors
          : [darkGrey, '#1A1A1A', darkGrey];
      
      case 'connections':
        return theme === 'light'
          ? ['#e0f2fe', '#f0f9ff', '#e0f2fe'] // Ocean light
          : [darkGrey, '#1A1A1A', darkGrey]; // Consistent dark
      
      default:
        return theme === 'light' 
          ? dreamyGradientColors 
          : [darkGrey, '#1A1A1A', darkGrey];
    }
  };

  // For light mode, always use the dreamy gradient
  // For dark mode, use solid charcoal (matching numina-mobile exactly)
  if (theme === 'dark') {
    return (
      <View 
        style={[
          styles.container,
          { backgroundColor: darkGrey },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // Light mode with dreamy gradients
  return (
    <LinearGradient
      colors={getGradientColors() as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PageBackground;