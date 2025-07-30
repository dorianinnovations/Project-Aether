// Theme and styling utilities

import { Appearance, ColorSchemeName } from 'react-native';

export const getSystemTheme = (): 'light' | 'dark' => {
  const colorScheme: ColorSchemeName = Appearance.getColorScheme();
  return colorScheme === 'dark' ? 'dark' : 'light';
};

export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'Good Morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
};

export const getPersonalizedGreeting = (name?: string): string => {
  const timeGreeting = getTimeBasedGreeting();
  const firstName = name?.split(' ')[0] || 'User';
  return `${timeGreeting}, ${firstName}`;
};

export const interpolateColor = (
  progress: number,
  inputRange: number[],
  outputRange: string[]
): string => {
  // Simple linear interpolation for colors
  // This is a basic implementation - for complex color interpolation,
  // consider using a library like react-native-reanimated
  
  if (progress <= inputRange[0]) return outputRange[0];
  if (progress >= inputRange[inputRange.length - 1]) return outputRange[outputRange.length - 1];
  
  for (let i = 0; i < inputRange.length - 1; i++) {
    if (progress >= inputRange[i] && progress <= inputRange[i + 1]) {
      const ratio = (progress - inputRange[i]) / (inputRange[i + 1] - inputRange[i]);
      // For now, just return the closest color
      return ratio < 0.5 ? outputRange[i] : outputRange[i + 1];
    }
  }
  
  return outputRange[0];
};