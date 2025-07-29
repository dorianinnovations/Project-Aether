/**
 * Aether Design System - Typography Tokens
 * Unified font system with Crimson Pro, Nunito, and Inter
 */

import { Platform } from 'react-native';

// Helper function to get font family with fallbacks
const getFontFamily = (fontName: string, fallback: string = 'System') => {
  return Platform.select({
    ios: fontName,
    android: fontName,
    default: fallback
  });
};

export const typography = {
  // Font Family System - Unified font system
  fonts: {
    // Crimson Pro for headers and titles (serif)
    heading: 'CrimsonPro-Regular',
    headingMedium: 'CrimsonPro-Medium',
    headingSemiBold: 'CrimsonPro-SemiBold',
    headingBold: 'CrimsonPro-Bold',
    
    // Nunito for reading and body text (sans-serif)
    body: 'Nunito-Regular',
    bodyMedium: 'Nunito-Medium',
    bodySemiBold: 'Nunito-SemiBold',
    bodyBold: 'Nunito-Bold',
    
    // Inter for misc text and UI elements (sans-serif)
    ui: 'Inter-Regular',
    uiMedium: 'Inter-Medium',
    uiSemiBold: 'Inter-SemiBold',
    uiBold: 'Inter-Bold',
    
    // Fallback to system fonts
    system: 'System',
  },
  
  // Typography Scale (Based on 1.25 ratio - perfect harmony)
  scale: {
    xs: 12,   // Supporting text, timestamps
    sm: 14,   // Body text, descriptions
    base: 16, // Default text size
    lg: 16,   // Subheadings, important labels (reduced from 20)
    xl: 19,   // Section titles, screen headers (reduced from 24)
    '2xl': 26, // Page titles, hero text (reduced from 32)
    '3xl': 32, // Large display text (reduced from 40)
    '4xl': 38, // Extra large display (reduced from 48)
  },
  
  // Line Height System (Optimal readability ratios)
  lineHeights: {
    tight: 1.2,   // Headlines, titles
    normal: 1.5,  // Body text, default
    relaxed: 1.7, // Long-form content
    loose: 2.0,   // Extra spacing for emphasis
  },
  
  // Letter Spacing (Tighter for more compact feel)
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: -0.1,
    wide: 0.1,
    wider: 0.25,
    widest: 0.5,
  },
  
  // Text Styles - Pre-composed combinations
  textStyles: {
    // Display Text (Large, impactful) - Crimson Pro - 20% smaller
    displayLarge: {
      fontSize: 38,
      fontFamily: getFontFamily('CrimsonPro-Bold', 'serif'),
      fontWeight: '700' as const,
      lineHeight: 46,
      letterSpacing: -0.8,
    },
    displayMedium: {
      fontSize: 32,
      fontFamily: getFontFamily('CrimsonPro-Bold', 'serif'),
      fontWeight: '700' as const,
      lineHeight: 38,
      letterSpacing: -0.4,
    },
    displaySmall: {
      fontSize: 26,
      fontFamily: getFontFamily('CrimsonPro-SemiBold', 'serif'),
      fontWeight: '600' as const,
      lineHeight: 30,
      letterSpacing: -0.1,
    },
    
    // Headlines (Screen titles, section headers) - Crimson Pro - 20% smaller
    headlineLarge: {
      fontSize: 19,
      fontFamily: getFontFamily('CrimsonPro-SemiBold', 'serif'),
      fontWeight: '600' as const,
      lineHeight: 25,
      letterSpacing: -0.1,
    },
    headlineMedium: {
      fontSize: 16,
      fontFamily: getFontFamily('CrimsonPro-Medium', 'serif'),
      fontWeight: '500' as const,
      lineHeight: 21,
      letterSpacing: -0.1,
    },
    headlineSmall: {
      fontSize: 14,
      fontFamily: getFontFamily('CrimsonPro-Medium', 'serif'),
      fontWeight: '500' as const,
      lineHeight: 20,
      letterSpacing: -0.1,
    },
    
    // Body Text (Main content) - Nunito
    bodyLarge: {
      fontSize: 16,
      fontFamily: getFontFamily('Nunito-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: -0.1,
    },
    bodyMedium: {
      fontSize: 14,
      fontFamily: getFontFamily('Nunito-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 21,
      letterSpacing: -0.1,
    },
    bodySmall: {
      fontSize: 12,
      fontFamily: getFontFamily('Nunito-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 17,
      letterSpacing: -0.1,
    },
    
    // Backward compatibility aliases
    body: {
      fontSize: 16,
      fontFamily: getFontFamily('Nunito-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: -0.1,
    },
    
    // Labels (Buttons, form labels) - Inter
    labelLarge: {
      fontSize: 16,
      fontFamily: getFontFamily('Inter-Medium', 'sans-serif'),
      fontWeight: '500' as const,
      lineHeight: 22,
      letterSpacing: 0.1,
    },
    labelMedium: {
      fontSize: 14,
      fontFamily: getFontFamily('Inter-Medium', 'sans-serif'),
      fontWeight: '500' as const,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    labelSmall: {
      fontSize: 12,
      fontFamily: getFontFamily('Inter-Medium', 'sans-serif'),
      fontWeight: '500' as const,
      lineHeight: 17,
      letterSpacing: 0.25,
    },
    
    // Captions (Supporting text, metadata) - Inter
    caption: {
      fontSize: 12,
      fontFamily: getFontFamily('Inter-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 16,
      letterSpacing: 0.1,
    },
    overline: {
      fontSize: 10,
      fontFamily: getFontFamily('Inter-Medium', 'sans-serif'),
      fontWeight: '500' as const,
      lineHeight: 15,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
    
    // Special AI/Chat Text Styles - Nunito for reading (Increased for better readability)
    aiMessage: {
      fontSize: 18,
      fontFamily: getFontFamily('Nunito-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 28,
      letterSpacing: -0.1,
    },
    userMessage: {
      fontSize: 18,
      fontFamily: getFontFamily('Nunito-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 26,
      letterSpacing: -0.1,
    },
    timestamp: {
      fontSize: 11,
      fontFamily: getFontFamily('Inter-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 14,
      letterSpacing: 0.1,
    },
    
    // Connection/Social Text Styles
    connectionTitle: {
      fontSize: 14,
      fontFamily: getFontFamily('CrimsonPro-SemiBold', 'serif'),
      fontWeight: '600' as const,
      lineHeight: 18,
      letterSpacing: -0.1,
    },
    compatibilityScore: {
      fontSize: 19,
      fontFamily: getFontFamily('CrimsonPro-Bold', 'serif'),
      fontWeight: '700' as const,
      lineHeight: 23,
      letterSpacing: -0.4,
    },
    
    // Analytics/Insights Text Styles
    metricValue: {
      fontSize: 22,
      fontFamily: getFontFamily('CrimsonPro-Bold', 'serif'),
      fontWeight: '700' as const,
      lineHeight: 27,
      letterSpacing: -0.4,
    },
    metricLabel: {
      fontSize: 14,
      fontFamily: getFontFamily('Inter-Medium', 'sans-serif'),
      fontWeight: '500' as const,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    insightText: {
      fontSize: 15,
      fontFamily: getFontFamily('Nunito-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: -0.1,
    },
  }
};

// Utility function to get text style with theme-aware colors
export const getTextStyle = (
  styleName: keyof typeof typography.textStyles,
  theme: 'light' | 'dark' = 'light',
  colorOverride?: string
) => {
  const baseStyle = typography.textStyles[styleName];
  const { getThemeColors } = require('./colors');
  const themeColors = getThemeColors(theme);
  
  return {
    ...baseStyle,
    color: colorOverride || themeColors.text,
  };
};

// Font loading configuration for Expo
export const fontConfig = {
  // Crimson Pro (serif) - for headers and titles
  'CrimsonPro-Regular': require('../../../assets/fonts/CrimsonPro-Regular.ttf'),
  'CrimsonPro-Medium': require('../../../assets/fonts/CrimsonPro-Medium.ttf'),
  'CrimsonPro-SemiBold': require('../../../assets/fonts/CrimsonPro-SemiBold.ttf'),
  'CrimsonPro-Bold': require('../../../assets/fonts/CrimsonPro-Bold.ttf'),
  
  // Nunito (sans-serif) - for reading and body text
  'Nunito-Regular': require('../../../assets/fonts/Nunito-Regular.ttf'),
  'Nunito-Medium': require('../../../assets/fonts/Nunito-Medium.ttf'),
  'Nunito-SemiBold': require('../../../assets/fonts/Nunito-SemiBold.ttf'),
  'Nunito-Bold': require('../../../assets/fonts/Nunito-Bold.ttf'),
  
  // Inter (sans-serif) - for misc text and UI elements
  'Inter-Regular': require('../../../assets/fonts/Inter-Regular.ttf'),
  'Inter-Medium': require('../../../assets/fonts/Inter-Medium.ttf'),
  'Inter-SemiBold': require('../../../assets/fonts/Inter-SemiBold.ttf'),
  'Inter-Bold': require('../../../assets/fonts/Inter-Bold.ttf'),
};

export default typography;