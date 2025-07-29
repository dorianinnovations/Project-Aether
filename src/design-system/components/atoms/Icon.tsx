/**
 * Aether Design System - Icon Component
 * Centralized icon management with consistent sizing and theming
 */

import React from 'react';
import { ViewStyle } from 'react-native';
import { 
  Feather,
  MaterialIcons,
  Ionicons,
  AntDesign,
} from '@expo/vector-icons';

import { designTokens, getThemeColors } from '../../tokens/colors';

// Define icon families type
type IconFamily = 'Feather' | 'MaterialIcons' | 'Ionicons' | 'AntDesign';

// Icon mapping with different icon sets for better coverage
export const iconMap: Record<string, { family: IconFamily; name: string }> = {
  // Chat & Communication
  'message-circle': { family: 'Feather', name: 'message-circle' },
  'message-square': { family: 'Feather', name: 'message-square' },
  'bot': { family: 'MaterialIcons', name: 'smart-toy' },
  'mic': { family: 'Feather', name: 'mic' },
  'mic-off': { family: 'Feather', name: 'mic-off' },
  'send': { family: 'Feather', name: 'send' },
  
  // Analytics & Insights
  'bar-chart': { family: 'Feather', name: 'bar-chart-2' },
  'trending-up': { family: 'Feather', name: 'trending-up' },
  'activity': { family: 'Feather', name: 'activity' },
  
  // Social & Connections
  'users': { family: 'Feather', name: 'users' },
  'link': { family: 'Feather', name: 'link' },
  'heart': { family: 'Feather', name: 'heart' },
  'star': { family: 'Feather', name: 'star' },
  
  // Settings & Controls
  'settings': { family: 'Feather', name: 'settings' },
  'palette': { family: 'MaterialIcons', name: 'palette' },
  'bell': { family: 'Feather', name: 'bell' },
  'user': { family: 'Feather', name: 'user' },
  'info': { family: 'Feather', name: 'info' },
  'log-out': { family: 'Feather', name: 'log-out' },
  'save': { family: 'Feather', name: 'save' },
  'volume-2': { family: 'Feather', name: 'volume-2' },
  'smartphone': { family: 'Feather', name: 'smartphone' },
  
  // Theme & Appearance
  'moon': { family: 'Feather', name: 'moon' },
  'sun': { family: 'Feather', name: 'sun' },
  
  // Actions
  'plus': { family: 'Feather', name: 'plus' },
  'x': { family: 'Feather', name: 'x' },
  'check': { family: 'Feather', name: 'check' },
  'edit': { family: 'Feather', name: 'edit' },
  'trash': { family: 'Feather', name: 'trash-2' },
  'copy': { family: 'Feather', name: 'copy' },
  'share': { family: 'Feather', name: 'share' },
  'download': { family: 'Feather', name: 'download' },
  'upload': { family: 'Feather', name: 'upload' },
  'refresh': { family: 'Feather', name: 'refresh-cw' },
  'refresh-cw': { family: 'Feather', name: 'refresh-cw' },
  
  // Navigation
  'chevron-right': { family: 'Feather', name: 'chevron-right' },
  'chevron-left': { family: 'Feather', name: 'chevron-left' },
  'chevron-up': { family: 'Feather', name: 'chevron-up' },
  'chevron-down': { family: 'Feather', name: 'chevron-down' },
  'arrow-left': { family: 'Feather', name: 'arrow-left' },
  'arrow-right': { family: 'Feather', name: 'arrow-right' },
  'arrow-up': { family: 'Feather', name: 'arrow-up' },
  'arrow-down': { family: 'Feather', name: 'arrow-down' },
  
  // Common UI
  'home': { family: 'Feather', name: 'home' },
  'search': { family: 'Feather', name: 'search' },
  'menu': { family: 'Feather', name: 'menu' },
  'more-horizontal': { family: 'Feather', name: 'more-horizontal' },
  'more-vertical': { family: 'Feather', name: 'more-vertical' },
  'external-link': { family: 'Feather', name: 'external-link' },
  
  // Visibility
  'eye': { family: 'Feather', name: 'eye' },
  'eye-off': { family: 'Feather', name: 'eye-off' },
  
  // Security
  'lock': { family: 'Feather', name: 'lock' },
  'unlock': { family: 'Feather', name: 'unlock' },
  'shield': { family: 'Feather', name: 'shield' },
  
  // Media
  'camera': { family: 'Feather', name: 'camera' },
  'image': { family: 'Feather', name: 'image' },
  'play': { family: 'Feather', name: 'play' },
  'pause': { family: 'Feather', name: 'pause' },
  'square': { family: 'Feather', name: 'square' },
  'skip-back': { family: 'Feather', name: 'skip-back' },
  'skip-forward': { family: 'Feather', name: 'skip-forward' },
  
  // Files & Data
  'file': { family: 'Feather', name: 'file' },
  'file-text': { family: 'Feather', name: 'file-text' },
  'folder': { family: 'Feather', name: 'folder' },
  'database': { family: 'Feather', name: 'database' },
  'server': { family: 'Feather', name: 'server' },
  'cloud': { family: 'Feather', name: 'cloud' },
  'cloud-off': { family: 'Feather', name: 'cloud-off' },
  
  // Time & Location
  'clock': { family: 'Feather', name: 'clock' },
  'calendar': { family: 'Feather', name: 'calendar' },
  'map-pin': { family: 'Feather', name: 'map-pin' },
  
  // Connectivity
  'wifi': { family: 'Feather', name: 'wifi' },
  'wifi-off': { family: 'Feather', name: 'wifi-off' },
  'bluetooth': { family: 'Feather', name: 'bluetooth' },
  'globe': { family: 'Feather', name: 'globe' },
  
  // Status & Alerts
  'alert-circle': { family: 'Feather', name: 'alert-circle' },
  'alert-triangle': { family: 'Feather', name: 'alert-triangle' },
  'check-circle': { family: 'Feather', name: 'check-circle' },
  'x-circle': { family: 'Feather', name: 'x-circle' },
  'help-circle': { family: 'Feather', name: 'help-circle' },
  
  // Business & Commerce
  'dollar-sign': { family: 'Feather', name: 'dollar-sign' },
  'credit-card': { family: 'Feather', name: 'credit-card' },
  'shopping-cart': { family: 'Feather', name: 'shopping-cart' },
  'gift': { family: 'Feather', name: 'gift' },
  
  // Organization
  'filter': { family: 'Feather', name: 'filter' },
  'grid': { family: 'Feather', name: 'grid' },
  'list': { family: 'Feather', name: 'list' },
  'bookmark': { family: 'Feather', name: 'bookmark' },
  'tag': { family: 'Feather', name: 'tag' },
  
  // Special
  'zap': { family: 'Feather', name: 'zap' },
  'award': { family: 'Feather', name: 'award' },
  'target': { family: 'Feather', name: 'target' },
  'compass': { family: 'Feather', name: 'compass' },
  'flag': { family: 'Feather', name: 'flag' },
} as const;

export type IconName = keyof typeof iconMap;

// Size presets following design system
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | number;

const sizeMap: Record<Exclude<IconSize, number>, number> = {
  xs: 12,   // Small indicators, badges
  sm: 16,   // Text inline, small buttons
  md: 20,   // Default size, form inputs
  lg: 24,   // Tab icons, medium buttons
  xl: 32,   // Large buttons, headers
  xxl: 48,  // Hero icons, major features
};

export interface IconProps {
  /** Icon name from the iconMap */
  name: IconName;
  /** Icon size - preset or custom number */
  size?: IconSize;
  /** Icon color - theme-aware or custom hex */
  color?: 'primary' | 'secondary' | 'muted' | 'success' | 'error' | 'warning' | 'accent' | string;
  /** Theme for color resolution */
  theme?: 'light' | 'dark';
  /** Additional styles */
  style?: ViewStyle;
}

const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color = 'primary',
  theme = 'light',
  style,
}) => {
  // Resolve size
  const iconSize = typeof size === 'number' ? size : sizeMap[size];
  
  // Resolve color
  const getIconColor = (): string => {
    const themeColors = getThemeColors(theme as 'light' | 'dark');
    
    switch (color) {
      case 'primary':
        return themeColors.primary;
      case 'secondary':
        return themeColors.textSecondary;
      case 'muted':
        return themeColors.textMuted;
      case 'success':
        return designTokens.semantic.success;
      case 'error':
        return designTokens.semantic.error;
      case 'warning':
        return designTokens.semantic.warning;
      case 'accent':
        return designTokens.brand.accent;
      default:
        // Custom hex color or fallback
        return color.startsWith('#') ? color : themeColors.text;
    }
  };
  
  // Get icon configuration
  const iconConfig = iconMap[name];
  
  if (!iconConfig) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return null;
  }
  
  // Render the appropriate icon family
  const iconProps = {
    size: iconSize,
    color: getIconColor(),
    style,
  };
  
  switch (iconConfig.family) {
    case 'Feather':
      return <Feather name={iconConfig.name as any} {...iconProps} />;
    case 'MaterialIcons':
      return <MaterialIcons name={iconConfig.name as any} {...iconProps} />;
    case 'Ionicons':
      return <Ionicons name={iconConfig.name as any} {...iconProps} />;
    case 'AntDesign':
      return <AntDesign name={iconConfig.name as any} {...iconProps} />;
    default:
      console.warn(`Icon family "${iconConfig.family}" not supported`);
      return null;
  }
};

export default Icon;