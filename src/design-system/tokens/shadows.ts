/**
 * Aether Design System - Shadow Tokens
 * Sophisticated neumorphic shadow system for depth and elegance
 */

import { designTokens } from './colors';

export const shadows = {
  // Neumorphic Shadow System - The Heart of Your Design
  neumorphic: {
    light: {
      // Elevated surfaces (buttons, cards floating above background)
      elevated: {
        shadowColor: designTokens.surfaces.light.shadow,
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8, // Android
        // CSS equivalent: '8px 8px 16px rgba(224, 224, 224, 0.15), -8px -8px 16px rgba(255, 255, 255, 0.7)'
      },
      
      // Subtle elevation (list items, nav elements)
      subtle: {
        shadowColor: designTokens.surfaces.light.shadow,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        // CSS: '4px 4px 8px rgba(224, 224, 224, 0.1), -4px -4px 8px rgba(255, 255, 255, 0.5)'
      },
      
      // Inset/pressed state (inputs, pressed buttons)
      inset: {
        shadowColor: designTokens.surfaces.light.shadow,
        shadowOffset: { width: -4, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: -2,
        // CSS: 'inset 4px 4px 8px rgba(224, 224, 224, 0.12), inset -4px -4px 8px rgba(255, 255, 255, 0.8)'
      },
      
      // Floating elements (modals, tooltips)
      floating: {
        shadowColor: designTokens.surfaces.light.shadow,
        shadowOffset: { width: 12, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
      },
      
      // Interactive hover state
      hover: {
        shadowColor: designTokens.surfaces.light.shadow,
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
      }
    },
    
    dark: {
      // Dark theme neumorphic shadows
      elevated: {
        shadowColor: '#000000',
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
        // CSS: '8px 8px 16px rgba(0, 0, 0, 0.4), -8px -8px 16px rgba(51, 51, 51, 0.1)'
      },
      
      subtle: {
        shadowColor: '#000000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      },
      
      inset: {
        shadowColor: '#000000',
        shadowOffset: { width: -4, height: -4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: -2,
      },
      
      floating: {
        shadowColor: '#000000',
        shadowOffset: { width: 12, height: 12 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
        elevation: 12,
      },
      
      hover: {
        shadowColor: '#000000',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
      }
    }
  },
  
  // Traditional Material Design shadows (fallback/compatibility)
  material: {
    none: {
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.44,
      shadowRadius: 10.32,
      elevation: 16,
    }
  },
  
  // Glow effects for special elements
  glow: {
    primary: {
      shadowColor: designTokens.brand.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 0,
    },
    success: {
      shadowColor: designTokens.semantic.success,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 0,
    },
    error: {
      shadowColor: designTokens.semantic.error,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 0,
    },
    connection: {
      shadowColor: designTokens.semantic.love,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 0,
    }
  }
};

// Shadow presets for specific component types
export const componentShadows = {
  button: {
    default: shadows.neumorphic.light.subtle,
    pressed: shadows.neumorphic.light.inset,
    hover: shadows.neumorphic.light.hover,
  },
  
  card: {
    default: shadows.neumorphic.light.elevated,
    hover: shadows.neumorphic.light.floating,
  },
  
  input: {
    default: shadows.neumorphic.light.inset,
    focused: shadows.neumorphic.light.subtle,
  },
  
  modal: {
    backdrop: shadows.neumorphic.light.floating,
  },
  
  message: {
    user: shadows.neumorphic.light.subtle,
    aether: shadows.neumorphic.light.elevated,
    system: shadows.material.sm,
  },
  
  connection: {
    card: shadows.neumorphic.light.elevated,
    compatibility: shadows.glow.connection,
  },
  
  insight: {
    metric: shadows.neumorphic.light.elevated,
    chart: shadows.neumorphic.light.subtle,
  },
  
  header: {
    menu: {
      light: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
      },
      dark: {
        shadowColor: '#ffffff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 8,
      }
    }
  }
};

// Utility functions
export const getShadowStyle = (
  shadowName: keyof typeof shadows.neumorphic.light,
  theme: 'light' | 'dark' = 'light'
) => {
  return shadows.neumorphic[theme][shadowName];
};

export const getNeumorphicStyle = (
  elevation: 'subtle' | 'elevated' | 'floating' | 'inset' | 'hover' = 'elevated',
  theme: 'light' | 'dark' = 'light'
) => {
  const shadow = shadows.neumorphic[theme][elevation];
  const surfaceColors = designTokens.surfaces[theme];
  
  return {
    backgroundColor: elevation === 'inset' ? surfaceColors.sunken : surfaceColors.elevated,
    ...shadow,
    // Add subtle border for enhanced neumorphic effect
    borderWidth: elevation === 'inset' ? 0 : 0.5,
    borderColor: theme === 'light' 
      ? 'rgba(255, 255, 255, 0.8)' 
      : 'rgba(255, 255, 255, 0.1)',
  };
};

// Create a neumorphic container style with proper theming
export const createNeumorphicContainer = (
  theme: 'light' | 'dark' = 'light',
  elevation: 'subtle' | 'elevated' | 'floating' = 'elevated',
  borderRadius: number = 12
) => {
  const neumorphicStyle = getNeumorphicStyle(elevation, theme);
  
  return {
    ...neumorphicStyle,
    borderRadius,
    overflow: 'hidden' as const,
  };
};

// Get header menu shadow based on theme
export const getHeaderMenuShadow = (theme: 'light' | 'dark' = 'light') => {
  return componentShadows.header.menu[theme];
};

export default shadows;