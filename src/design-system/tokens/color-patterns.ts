/**
 * Common Color Patterns - DRY utilities for consistent theming
 * Use these instead of hardcoding colors throughout the app
 */

import { designTokens, getSemanticColor } from './colors';

// Most commonly used color patterns - use these instead of hardcoding!
export const colorPatterns = {
  // Text colors based on theme
  text: {
    primary: (theme: 'light' | 'dark') => 
      theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary,
    secondary: (theme: 'light' | 'dark') => 
      theme === 'dark' ? designTokens.text.secondaryDark : designTokens.text.secondary,
    muted: (theme: 'light' | 'dark') => 
      theme === 'dark' ? designTokens.text.mutedDark : designTokens.text.muted,
    placeholder: (theme: 'light' | 'dark') => 
      theme === 'dark' ? designTokens.text.placeholderDark : designTokens.text.placeholder,
  },

  // Background colors based on theme
  background: {
    base: (theme: 'light' | 'dark') => 
      theme === 'dark' ? designTokens.brand.backgroundDark : designTokens.brand.backgroundLight,
    surface: (theme: 'light' | 'dark') => 
      theme === 'dark' ? designTokens.brand.surfaceDark : designTokens.brand.surface,
    elevated: (theme: 'light' | 'dark') => 
      theme === 'dark' ? designTokens.surfaces.dark.elevated : designTokens.surfaces.light.elevated,
    sunken: (theme: 'light' | 'dark') => 
      theme === 'dark' ? designTokens.surfaces.dark.sunken : designTokens.surfaces.light.sunken,
  },

  // Border colors based on theme
  border: {
    default: (theme: 'light' | 'dark') => 
      theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default,
    subtle: (theme: 'light' | 'dark') => 
      theme === 'dark' ? designTokens.borders.dark.subtle : designTokens.borders.light.subtle,
    strong: (theme: 'light' | 'dark') => 
      theme === 'dark' ? designTokens.borders.dark.strong : designTokens.borders.light.strong,
    accent: (theme: 'light' | 'dark') => 
      theme === 'dark' ? designTokens.borders.dark.accent : designTokens.borders.light.accent,
  },

  // Shadow colors based on theme
  shadow: {
    color: (theme: 'light' | 'dark') => 
      theme === 'dark' ? designTokens.surfaces.dark.shadow : designTokens.surfaces.light.shadow,
  },

  // Icon colors - most commonly used pattern
  icon: {
    // Standard icon color (the old #666666/#ffffff pattern)
    standard: (theme: 'light' | 'dark') => 
      theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
    // Muted icon color
    muted: (theme: 'light' | 'dark') => 
      theme === 'dark' ? designTokens.text.mutedDark : designTokens.text.muted,
    // Primary accent icon color
    accent: () => designTokens.brand.primary,
  },

  // Semantic colors - vibrant in dark mode!
  semantic: {
    success: (theme: 'light' | 'dark') => getSemanticColor('success', theme),
    error: (theme: 'light' | 'dark') => getSemanticColor('error', theme),
    warning: (theme: 'light' | 'dark') => getSemanticColor('warning', theme),
    info: (theme: 'light' | 'dark') => getSemanticColor('info', theme),
    love: (theme: 'light' | 'dark') => getSemanticColor('love', theme),
    wisdom: (theme: 'light' | 'dark') => getSemanticColor('wisdom', theme),
  },
};

// Utility functions for common theming patterns
export const getThemedColor = {
  text: colorPatterns.text,
  background: colorPatterns.background,
  border: colorPatterns.border,
  shadow: colorPatterns.shadow,
  icon: colorPatterns.icon,
  semantic: colorPatterns.semantic,
};

// Quick access to the most common pattern (what used to be #666666/#ffffff)
export const getStandardIconColor = (theme: 'light' | 'dark') => 
  colorPatterns.icon.standard(theme);

export const getStandardTextColor = (theme: 'light' | 'dark') => 
  colorPatterns.text.primary(theme);

export const getStandardBackgroundColor = (theme: 'light' | 'dark') => 
  colorPatterns.background.surface(theme);

export default colorPatterns;