/**
 * Numina Design System - Color Tokens
 * Based on sophisticated neumorphic design with dual-theme support
 */

export const designTokens = {
  // Primary Brand Colors - Clean OLED & Rainbow Pastels
  brand: {
    primary: '#E6F3FF',        // Light mode - light baby blue
    primaryDark: '#E6F3FF',    // Dark mode - same light baby blue
    accent: '#B3E5FC',         // Pastel cyan
    accentSecondary: '#FFCC80', // Pastel orange
    surface: '#FEFEFE',        // Almost white (light)
    surfaceDark: '#202020',    // Dark surface for dark mode
    backgroundLight: '#FAFAFA', // Off-white background
    backgroundDark: '#000000',  // Pure black background for dark mode
  },
  
  // Vibrant Soft Pastels - Perfect for icons and UI elements ✨
  pastels: {
    pink: '#FFB3D1',          // Vibrant soft pink
    cyan: '#87E8DE',          // Vibrant soft cyan  
    orange: '#FFB347',        // Vibrant soft peach
    purple: '#D8BFD8',        // Vibrant soft lavender
    green: '#90EE90',         // Vibrant soft mint green
    yellow: '#FFEB9C',        // Vibrant soft butter yellow
    coral: '#FFA07A',         // Vibrant soft coral
    mint: '#98FB98',          // Vibrant soft mint
    blue: '#87CEEB',          // Vibrant soft sky blue
    rose: '#FFB6C1',          // Vibrant soft rose
    sage: '#9ACD32',          // Vibrant soft sage green
    cream: '#FFEFD5',         // Vibrant soft cream
  },
  
  // Semantic Colors - Using Rainbow Pastels
  semantic: {
    success: '#C8E6C9',        // Pastel green - achievements, growth
    error: '#FFCDD2',          // Pastel coral - errors, warnings
    warning: '#FFF9C4',        // Pastel yellow - caution, attention
    info: '#B3E5FC',           // Pastel cyan - information, tips
    love: '#E6F3FF',           // Light baby blue - connections, relationships
    wisdom: '#E1BEE7',         // Pastel purple - insights, intelligence
  },

  // Vibrant Dark Mode Semantic Colors - Much more visible! 🌟
  semanticDark: {
    success: '#7DCE82',        // Bright green - achievements, growth
    error: '#FF6B9D',          // Bright coral - errors, warnings  
    warning: '#FFD23F',        // Bright yellow - caution, attention
    info: '#4ECDC4',           // Bright cyan - information, tips
    love: '#4CB8FF',           // Bright blue - connections, relationships
    wisdom: '#C77DFF',         // Bright purple - insights, intelligence
  },
  
  // Text Color Hierarchy - Clean & High Contrast
  text: {
    primary: '#1a1a1a',        // Light mode primary text (dark grey)
    primaryDark: '#ffffff',     // Dark mode primary text (pure white)
    secondary: '#666666',       // Light mode secondary text (medium grey)
    secondaryDark: '#cccccc',   // Dark mode secondary text (light grey)
    muted: '#999999',           // Light mode muted text (lighter grey)
    mutedDark: '#888888',       // Dark mode muted text (medium grey)
    placeholder: '#cccccc',     // Light mode placeholder
    placeholderDark: '#666666', // Dark mode placeholder
  },
  
  // Clean Surface Colors - OLED Black & Off-White
  surfaces: {
    // Light Theme Surfaces - Super Light Greys
    light: {
      base: '#FAFAFA',         // Off-white base
      elevated: '#FFFFFF',      // Pure white elevated surfaces
      sunken: '#F5F5F5',       // Very light grey sunken
      highlight: '#FFFFFF',     // Pure white highlight
      shadow: '#E0E0E0',       // Light grey shadow
    },
    // Dark Theme Surfaces - Balanced Dark Mode
    dark: {
      base: '#151515',         // Dark base (good for page bg)
      elevated: '#202020',      // Dark elevated (good for headers/buttons)
      sunken: '#101010',       // Very dark sunken
      highlight: '#2A2A2A',     // Medium grey highlight
      shadow: '#000000',       // Pure black shadow
    }
  },
  
  // Border System - Contrasting Light Colors
  borders: {
    light: {
      default: '#E0E0E0',      // Light grey border
      subtle: '#F0F0F0',       // Very light grey
      strong: '#CCCCCC',       // Medium grey
      accent: '#E6F3FF',       // Light baby blue accent border
    },
    dark: {
      default: '#333333',      // Dark grey border
      subtle: '#1A1A1A',       // Very dark grey
      strong: '#555555',       // Medium dark grey
      accent: '#E6F3FF',       // Light baby blue accent border
    }
  },
  
  // Rainbow Pastel Theme Variants
  variants: {
    default: {
      primary: '#E6F3FF',      // Light baby blue
      background: '#FAFAFA',
      surface: '#FFFFFF',
    },
    cyan: {
      primary: '#B3E5FC',      // Pastel cyan
      background: '#FAFAFA', 
      surface: '#FFFFFF',
    },
    mint: {
      primary: '#B2DFDB',      // Pastel mint
      background: '#FAFAFA',
      surface: '#FFFFFF',
    },
    orange: {
      primary: '#FFCC80',      // Pastel orange
      background: '#FAFAFA',
      surface: '#FFFFFF',
    },
    purple: {
      primary: '#E1BEE7',      // Pastel purple
      background: '#FAFAFA',
      surface: '#FFFFFF',
    },
    coral: {
      primary: '#FFCDD2',      // Pastel coral
      background: '#FAFAFA',
      surface: '#FFFFFF',
    },
    green: {
      primary: '#C8E6C9',      // Pastel green
      background: '#FAFAFA',
      surface: '#FFFFFF',
    },
    yellow: {
      primary: '#FFF9C4',      // Pastel yellow
      background: '#FAFAFA',
      surface: '#FFFFFF',
    },
    rainbow: {
      primary: '#E6F3FF',      // Cycling rainbow primary
      background: '#FAFAFA',
      surface: '#FFFFFF',
    },
    oled: {
      primary: '#E6F3FF',      // Light baby blue for OLED
      background: '#000000',   // Pure black for OLED
      surface: '#000000',      // Pure black surface for OLED
    }
  }
};

// Semantic color mappings for different states - Rainbow Pastels
export const stateColors = {
  interactive: {
    default: designTokens.brand.primary,    // Light baby blue
    hover: '#F0F8FF',                       // Lighter baby blue
    pressed: '#CCE7FF',                     // Darker baby blue
    disabled: '#F0F0F0',                    // Light grey
    focus: designTokens.brand.primary,      // Same light baby blue
  },
  
  connection: {
    soulResonance: '#E6F3FF',      // Light baby blue - deep connection
    growthCompanion: '#C8E6C9',    // Pastel green - mutual growth
    intellectualPeer: '#B3E5FC',   // Pastel cyan - mental stimulation
    emotionalSupport: '#FFCC80',   // Pastel orange - warmth and comfort
    creativeCollaborator: '#E1BEE7', // Pastel purple - creativity
    wisdomExchange: '#B2DFDB',     // Pastel mint - wisdom
    adventureBuddy: '#FFCC80',     // Pastel orange - adventure
    philosophicalAlly: '#E1BEE7',  // Pastel purple - deep thinking
  },
  
  numina: {
    thinking: '#CCCCCC',          // Light grey - AI processing
    responding: '#B3E5FC',        // Pastel cyan - AI active
    complete: '#C8E6C9',          // Pastel green - response complete
    error: '#FFCDD2',             // Pastel coral - AI error
    streaming: '#E1BEE7',         // Pastel purple - streaming response
  }
};

// Export utility functions - SIMPLIFIED
export const getThemeColors = (theme: 'light' | 'dark' = 'light') => ({
  primary: designTokens.brand.primary,
  background: theme === 'light' ? designTokens.brand.backgroundLight : designTokens.brand.backgroundDark,
  surface: theme === 'light' ? designTokens.brand.surface : designTokens.brand.surfaceDark,
  text: theme === 'light' ? designTokens.text.primary : designTokens.text.primaryDark,
  textSecondary: theme === 'light' ? designTokens.text.secondary : designTokens.text.secondaryDark,
  textMuted: theme === 'light' ? designTokens.text.muted : designTokens.text.mutedDark,
  surfaces: designTokens.surfaces[theme],
  borders: designTokens.borders[theme],
});

// Border utility function for consistent borders across components
export const getBorderStyle = (
  theme: 'light' | 'dark' = 'light', 
  variant: 'default' | 'subtle' | 'strong' | 'accent' = 'default'
) => ({
  borderWidth: 1,
  borderColor: designTokens.borders[theme][variant],
});

// Standard component border styles
export const getComponentBorder = (theme: 'light' | 'dark' = 'light') => ({
  borderWidth: 1,
  borderColor: designTokens.borders[theme].default,
});

// Quick border utility for containers, boxes, and any component
export const getStandardBorder = (theme: 'light' | 'dark' = 'light') => ({
  borderWidth: 1,
  borderColor: designTokens.borders[theme].default,
});

// Vibrant Dark Mode Pastels - Much more visible and alive! ✨
export const darkModePastels = {
  pink: '#FF8FA3',          // Vibrant coral pink
  cyan: '#4ECDC4',          // Bright teal cyan  
  orange: '#FFB84D',        // Bright golden orange
  purple: '#C77DFF',        // Vibrant lavender purple
  green: '#4ECDC4',         // Bright mint green
  yellow: '#FFD23F',        // Vibrant sunny yellow
  coral: '#FF6B9D',         // Bright coral
  mint: '#4ECDC4',          // Bright mint
  blue: '#4CB8FF',          // Vibrant sky blue
  rose: '#FF8FA3',          // Vibrant rose
  sage: '#7DCE82',          // Bright sage green
  cream: '#FFEB9C',         // Bright cream yellow
};

// Cycling pastel colors for user messages - theme aware!
const lightPastelArray = [
  designTokens.pastels.pink,
  designTokens.pastels.cyan,
  designTokens.pastels.orange,
  designTokens.pastels.purple,
  designTokens.pastels.green,
  designTokens.pastels.yellow,
  designTokens.pastels.coral,
  designTokens.pastels.mint,
];

const darkPastelArray = [
  darkModePastels.pink,
  darkModePastels.cyan,
  darkModePastels.orange,
  darkModePastels.purple,
  darkModePastels.green,
  darkModePastels.yellow,
  darkModePastels.coral,
  darkModePastels.mint,
];

// Get cycling pastel color based on message index or ID - theme aware!
export const getCyclingPastelColor = (index: number, theme: 'light' | 'dark' = 'light'): string => {
  const pastelArray = theme === 'dark' ? darkPastelArray : lightPastelArray;
  return pastelArray[index % pastelArray.length];
};

// Get user message color based on message count and settings - theme aware!
export const getUserMessageColor = (messageIndex: number, theme: 'light' | 'dark' = 'light', colorfulEnabled?: boolean): string => {
  if (colorfulEnabled === false) {
    // Return a standard cohesive color that matches the bot bubbles
    const themeColors = getThemeColors(theme);
    return themeColors.surface;
  }
  return getCyclingPastelColor(messageIndex, theme);
};

// Bright Rainbow Pastel Icon Color System
export const iconColors = {
  // Menu icons with bright rainbow pastels
  home: '#4FB3D9',        // Bright sky blue
  chat: '#5FD068',        // Bright mint green  
  profile: '#B84FC7',     // Bright purple
  connections: '#FF7A85', // Bright coral
  insights: '#42E8DB',    // Bright cyan
  settings: '#95D982',    // Bright sage green
  help: '#FFD54F',        // Bright sunny yellow
  notifications: '#FF8A95', // Bright rose
  search: '#7FDBCA',      // Bright mint
  menu: '#FFA726',        // Bright orange
  back: '#F48FB1',        // Bright pink
  close: '#FF8A65',       // Bright peach
  signout: '#FF5252',     // Bright red for sign out action
};


// Get soft pastel color for any icon by name
export const getIconColor = (iconName: keyof typeof iconColors, theme: 'light' | 'dark' = 'light'): string => {
  const baseColor = iconColors[iconName] || '#4FB3D9';
  
  // In dark mode, use even more vibrant versions
  if (theme === 'dark') {
    // Map bright icons to extra vibrant dark mode versions
    const colorMapping: Record<string, string> = {
      '#4FB3D9': '#5CC7E8',    // Even brighter sky blue
      '#5FD068': '#6AE86F',    // Even brighter mint green
      '#B84FC7': '#C95FD6',    // Even brighter purple
      '#FF7A85': '#FF8A95',    // Even brighter coral
      '#42E8DB': '#4EF5E6',    // Even brighter cyan
      '#95D982': '#A5E690',    // Even brighter sage
      '#FFD54F': '#FFE066',    // Even brighter yellow
      '#FF8A95': '#FFA0AB',    // Even brighter rose
      '#7FDBCA': '#8FE8D7',    // Even brighter mint
      '#FFA726': '#FFB74D',    // Even brighter orange
      '#F48FB1': '#FF9FC7',    // Even brighter pink
      '#FF8A65': '#FF9A7A',    // Even brighter peach
      '#FF5252': '#FF6B6B',    // Even brighter red for sign out
    };
    
    return colorMapping[baseColor] || '#5CC7E8';
  }
  
  return baseColor;
};

// Loading Text Colors - Subtle gradients for depth
export const loadingTextColors = {
  light: {
    primary: '#2a2a2a',     // Dark grey for light mode
    secondary: '#3a3a3a',   // Slightly lighter dark grey for gradient
  },
  dark: {
    primary: '#e0e0e0',     // Bright grey for dark mode  
    secondary: '#f0f0f0',   // Slightly brighter grey for gradient
  }
};

// Get loading text color with subtle gradient effect
export const getLoadingTextColor = (theme: 'light' | 'dark' = 'light', variant: 'primary' | 'secondary' = 'primary'): string => {
  return loadingTextColors[theme][variant];
};

// Get semantic color based on theme - much more vibrant in dark mode!
export const getSemanticColor = (
  semantic: 'success' | 'error' | 'warning' | 'info' | 'love' | 'wisdom',
  theme: 'light' | 'dark' = 'light'
): string => {
  return theme === 'dark' ? designTokens.semanticDark[semantic] : designTokens.semantic[semantic];
};

export default designTokens;