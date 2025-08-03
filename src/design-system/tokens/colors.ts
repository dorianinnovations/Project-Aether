export const designTokens = {
  brand: {
    primary: '#E6F3FF',
    primaryDark: '#E6F3FF',
    accent: '#B3E5FC',
    accentSecondary: '#FFCC80',
    surface: '#FEFEFE',
    surfaceDark: '#202020',
    backgroundLight: '#FAFAFA',
    backgroundDark: '#000000',
  },
  
  pastels: {
    pink: '#FFB3D1',
    cyan: '#87E8DE',
    orange: '#FFB347',
    purple: '#D8BFD8',
    green: '#90EE90',
    yellow: '#FFEB9C',
    coral: '#FFA07A',
    mint: '#98FB98',
    blue: '#87CEEB',
    rose: '#FFB6C1',
    sage: '#9ACD32',
    cream: '#FFEFD5',
  },
  
  semantic: {
    success: '#C8E6C9',
    error: '#FFCDD2',
    warning: '#FFF9C4',
    info: '#B3E5FC',
    love: '#E6F3FF',
    wisdom: '#E1BEE7',
  },

  semanticDark: {
    success: '#7DCE82',
    error: '#FF6B9D',
    warning: '#FFD23F',
    info: '#4ECDC4',
    love: '#4CB8FF',
    wisdom: '#C77DFF',
  },
  
  text: {
    primary: '#1a1a1a',
    primaryDark: '#ffffff',
    secondary: '#666666',
    secondaryDark: '#cccccc',
    muted: '#999999',
    mutedDark: '#888888',
    placeholder: '#cccccc',
    placeholderDark: '#666666',
  },
  
  surfaces: {
    light: {
      base: '#FAFAFA',
      elevated: '#FFFFFF',
      sunken: '#F5F5F5',
      highlight: '#FFFFFF',
      shadow: '#E0E0E0',
    },
    dark: {
      base: '#151515',
      elevated: '#202020',
      sunken: '#101010',
      highlight: '#2A2A2A',
      shadow: '#000000',
    }
  },
  
  borders: {
    light: {
      default: '#E0E0E0',
      subtle: '#F0F0F0',
      strong: '#CCCCCC',
      accent: '#E6F3FF',
    },
    dark: {
      default: '#333333',
      subtle: '#1A1A1A',
      strong: '#555555',
      accent: '#E6F3FF',
    }
  },
  
  variants: {
    default: {
      primary: '#E6F3FF',
      background: '#FAFAFA',
      surface: '#FFFFFF',
    },
    cyan: {
      primary: '#B3E5FC',
      background: '#FAFAFA', 
      surface: '#FFFFFF',
    },
    mint: {
      primary: '#B2DFDB',
      background: '#FAFAFA',
      surface: '#FFFFFF',
    },
    orange: {
      primary: '#FFCC80',
      background: '#FAFAFA',
      surface: '#FFFFFF',
    },
    purple: {
      primary: '#E1BEE7',
      background: '#FAFAFA',
      surface: '#FFFFFF',
    },
    coral: {
      primary: '#FFCDD2',
      background: '#FAFAFA',
      surface: '#FFFFFF',
    },
    green: {
      primary: '#C8E6C9',
      background: '#FAFAFA',
      surface: '#FFFFFF',
    },
    yellow: {
      primary: '#FFF9C4',
      background: '#FAFAFA',
      surface: '#FFFFFF',
    },
    rainbow: {
      primary: '#E6F3FF',
      background: '#FAFAFA',
      surface: '#FFFFFF',
    },
    oled: {
      primary: '#E6F3FF',
      background: '#000000',
      surface: '#000000',
    }
  }
};

export const stateColors = {
  interactive: {
    default: designTokens.brand.primary,
    hover: '#F0F8FF',
    pressed: '#CCE7FF',
    disabled: '#F0F0F0',
    focus: designTokens.brand.primary,
  },
  
  connection: {
    soulResonance: '#E6F3FF',
    growthCompanion: '#C8E6C9',
    intellectualPeer: '#B3E5FC',
    emotionalSupport: '#FFCC80',
    creativeCollaborator: '#E1BEE7',
    wisdomExchange: '#B2DFDB',
    adventureBuddy: '#FFCC80',
    philosophicalAlly: '#E1BEE7',
  },
  
  numina: {
    thinking: '#CCCCCC',
    responding: '#B3E5FC',
    complete: '#C8E6C9',
    error: '#FFCDD2',
    streaming: '#E1BEE7',
  }
};

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

export const getBorderStyle = (
  theme: 'light' | 'dark' = 'light', 
  variant: 'default' | 'subtle' | 'strong' | 'accent' = 'default'
) => ({
  borderWidth: 1,
  borderColor: designTokens.borders[theme][variant],
});

export const getComponentBorder = (theme: 'light' | 'dark' = 'light') => ({
  borderWidth: 1,
  borderColor: designTokens.borders[theme].default,
});

export const getStandardBorder = (theme: 'light' | 'dark' = 'light') => ({
  borderWidth: 1,
  borderColor: designTokens.borders[theme].default,
});

export const darkModePastels = {
  pink: '#FF8FA3',
  cyan: '#4ECDC4',
  orange: '#FFB84D',
  purple: '#C77DFF',
  green: '#4ECDC4',
  yellow: '#FFD23F',
  coral: '#FF6B9D',
  mint: '#4ECDC4',
  blue: '#4CB8FF',
  rose: '#FF8FA3',
  sage: '#7DCE82',
  cream: '#FFEB9C',
};

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

export const getCyclingPastelColor = (index: number, theme: 'light' | 'dark' = 'light'): string => {
  const pastelArray = theme === 'dark' ? darkPastelArray : lightPastelArray;
  return pastelArray[index % pastelArray.length];
};

export const getUserMessageColor = (messageIndex: number, theme: 'light' | 'dark' = 'light'): string => {
  const themeColors = getThemeColors(theme);
  return theme === 'light' ? '#F0F0F0' : themeColors.surface;
};

export const iconColors = {
  profile: '#FF6B6B',
  chat: '#FFB347',
  dashboard: '#FFE066',
  social: '#6AE86F',
  settings: '#5CC7E8',
  theme_toggle: '#C95FD6',
  signout: '#FF8FA3',
  
  home: '#4FB3D9',
  help: '#FFD54F',
  notifications: '#FF8A95',
  search: '#7FDBCA',
  menu: '#FFA726',
  back: '#F48FB1',
  close: '#FF8A65',
};


export const getIconColor = (iconName: keyof typeof iconColors, theme: 'light' | 'dark' = 'light'): string => {
  const baseColor = iconColors[iconName] || '#4FB3D9';
  
  if (theme === 'dark') {
    const colorMapping: Record<string, string> = {
      '#FF6B6B': '#FF7B7B',
      '#FFB347': '#FF9F66',
      '#FFE066': '#FFF080',
      '#6AE86F': '#7EF583',
      '#5CC7E8': '#70D4F5',
      '#C95FD6': '#D670E3',
      '#FF8FA3': '#FFA3B7',
      
      '#4FB3D9': '#5CC7E8',
      '#FFD54F': '#FFE066',
      '#FF8A95': '#FFA0AB',
      '#7FDBCA': '#8FE8D7',
      '#FFA726': '#FFB74D',
      '#F48FB1': '#FF9FC7',
      '#FF8A65': '#FF9A7A',
    };
    
    return colorMapping[baseColor] || '#5CC7E8';
  }
  
  return baseColor;
};

export const loadingTextColors = {
  light: {
    primary: '#2a2a2a',
    secondary: '#3a3a3a',
  },
  dark: {
    primary: '#e0e0e0',
    secondary: '#f0f0f0',
  }
};

export const getLoadingTextColor = (theme: 'light' | 'dark' = 'light', variant: 'primary' | 'secondary' = 'primary'): string => {
  return loadingTextColors[theme][variant];
};

export const getSemanticColor = (
  semantic: 'success' | 'error' | 'warning' | 'info' | 'love' | 'wisdom',
  theme: 'light' | 'dark' = 'light'
): string => {
  return theme === 'dark' ? designTokens.semanticDark[semantic] : designTokens.semantic[semantic];
};

// Button-specific color tokens
export const buttonColors = {
  light: {
    engineCompression: {
      background: '#FF6B35',
      border: '#E55A2B',
      text: '#FFFFFF',
    },
    editProfile: {
      background: '#8B5CF6',
      border: '#7C3AED',
      text: '#FFFFFF',
    },
  },
  dark: {
    engineCompression: {
      background: '#FF7A47',
      border: '#FF6B35',
      text: '#FFFFFF',
    },
    editProfile: {
      background: '#A78BFA',
      border: '#8B5CF6',
      text: '#FFFFFF',
    },
  },
};

// Get button colors by type and theme
export const getButtonColors = (
  buttonType: 'engineCompression' | 'editProfile',
  theme: 'light' | 'dark' = 'light'
) => {
  return buttonColors[theme][buttonType];
};

export default designTokens;