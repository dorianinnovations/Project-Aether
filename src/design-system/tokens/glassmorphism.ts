/**
 * Aether Design System - Glassmorphism Tokens
 * Beautiful glass-like effects for modern UI elements
 */

import { designTokens } from './colors';

export const glassmorphism = {
  light: {
    // Header bars, floating elements
    header: {
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    
    // Input fields, chat input
    input: {
      backgroundColor: '#FFFFFF',
      backdropFilter: 'blur(15px)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
      shadowColor: 'rgba(0, 0, 0, 0.08)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    
    // Cards, panels
    card: {
      backgroundColor: 'rgba(255, 255, 255, 0.75)',
      backdropFilter: 'blur(25px)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      shadowColor: 'rgba(0, 0, 0, 0.12)',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 6,
    },
    
    // Modal, overlay backgrounds
    overlay: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(30px)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
  },
  
  dark: {
    header: {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(20px)',
      borderWidth: 1,
      borderColor: 'rgba(51, 51, 51, 0.3)',
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    },
    
    input: {
      backgroundColor: 'rgba(26, 26, 26, 0.9)',
      backdropFilter: 'blur(15px)',
      borderWidth: 1,
      borderColor: 'rgba(51, 51, 51, 0.4)',
      shadowColor: 'rgba(0, 0, 0, 0.2)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    
    card: {
      backgroundColor: 'rgba(26, 26, 26, 0.75)',
      backdropFilter: 'blur(25px)',
      borderWidth: 1,
      borderColor: 'rgba(51, 51, 51, 0.25)',
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 6,
    },
    
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(30px)',
      borderWidth: 1,
      borderColor: 'rgba(51, 51, 51, 0.2)',
    },
  },
};

// Utility function to get glassmorphic style
export const getGlassmorphicStyle = (
  variant: 'header' | 'input' | 'card' | 'overlay' = 'card',
  theme: 'light' | 'dark' = 'light'
) => {
  return glassmorphism[theme][variant];
};

// Brick-style button for settings menu
export const brickButton = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  dark: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 51, 0.3)',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
};

export const getBrickButtonStyle = (theme: 'light' | 'dark' = 'light') => {
  return brickButton[theme];
};

export default glassmorphism;