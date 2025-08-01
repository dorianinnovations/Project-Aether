/**
 * Theme Selector Component
 * Simple segmented control for light/auto/dark theme selection
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../contexts/ThemeContext';
import { designTokens } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';

type ThemeMode = 'light' | 'system' | 'dark';

interface ThemeSelectorProps {
  style?: any;
  onThemeChange?: (mode: ThemeMode) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ style, onThemeChange }) => {
  const { theme, toggleTheme } = useTheme();
  
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return theme === 'dark' ? 'dark' : 'light';
  });

  const options: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: 'light', label: 'Light', icon: 'sun' },
    { mode: 'system', label: 'Auto', icon: 'smartphone' },
    { mode: 'dark', label: 'Dark', icon: 'moon' },
  ];

  const [containerWidth, setContainerWidth] = useState(0);
  const selectedIndicator = useRef(new Animated.Value(0)).current;

  const segmentWidth = containerWidth / 3;

  useEffect(() => {
    const selectedIndex = options.findIndex(option => option.mode === themeMode);
    
    Animated.spring(selectedIndicator, {
      toValue: selectedIndex * segmentWidth + 2,
      tension: 200,
      friction: 20,
      useNativeDriver: false,
    }).start();
  }, [themeMode, segmentWidth]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const handleThemePress = (mode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThemeMode(mode);
    
    if (mode === 'light' && theme === 'dark') {
      toggleTheme();
    } else if (mode === 'dark' && theme === 'light') {
      toggleTheme();
    }
    
    onThemeChange?.(mode);
  };

  useEffect(() => {
    setThemeMode(theme === 'dark' ? 'dark' : 'light');
  }, [theme]);

  const isDarkMode = theme === 'dark';

  return (
    <View style={styles.segmentedControl} onLayout={handleLayout}>
      <Animated.View
        style={[
          styles.selectedIndicator,
          {
            width: segmentWidth - 6,
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0, 0, 0, 0.12)',
            borderWidth: 1,
            borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0, 0, 0, 0.08)',
            transform: [{ translateX: selectedIndicator }],
          },
        ]}
      />
      
      {options.map((option, index) => {
        const isSelected = themeMode === option.mode;
        
        return (
          <TouchableOpacity
            key={option.mode}
            style={styles.segment}
            onPress={() => handleThemePress(option.mode)}
            activeOpacity={0.7}
          >
            <Feather 
              name={option.icon as any} 
              size={16} 
              color={isSelected 
                ? (isDarkMode ? '#FFFFFF' : '#000000')
                : (isDarkMode ? designTokens.text.secondaryDark : designTokens.text.secondary)
              }
              style={{ opacity: isSelected ? 1 : 0.7 }}
            />
            <Text style={[
              styles.segmentText,
              {
                color: isSelected 
                  ? (isDarkMode ? '#FFFFFF' : '#000000')
                  : (isDarkMode ? designTokens.text.secondaryDark : designTokens.text.secondary),
                fontWeight: isSelected ? '700' : '500',
                opacity: isSelected ? 1 : 0.7,
              }
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  segmentedControl: {
    flexDirection: 'row',
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 6,
    left: 2,
    bottom: 6,
    borderRadius: 10,
    zIndex: 0,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: spacing[2],
    gap: spacing[1],
    zIndex: 1,
  },
  segmentText: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
});

export default ThemeSelector;